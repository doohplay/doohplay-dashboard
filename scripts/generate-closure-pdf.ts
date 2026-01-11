/**
 * Gera e assina o PDF de um fechamento mensal
 * Uso:
 *   npx ts-node -P tsconfig.scripts.json scripts/generate-closure-pdf.ts <closure_id>
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'
import { closedReportHtml } from '../lib/reports/closedReportHtml'

// --------------------------------------------------
// 🔐 Supabase (SERVICE ROLE – obrigatório)
// --------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL ou SERVICE_ROLE_KEY não definidos')
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// --------------------------------------------------
// 🔑 Utils
// --------------------------------------------------
function generatePdfHash(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

// --------------------------------------------------
// 🚀 Main
// --------------------------------------------------
async function main() {
  const closureId = process.argv[2]

  if (!closureId) {
    console.error('❌ closure_id não informado')
    process.exit(1)
  }

  console.log('[SCRIPT] Gerando PDF do fechamento:', closureId)

  // --------------------------------------------------
  // 1️⃣ Buscar fechamento
  // --------------------------------------------------
  const { data: closure, error } = await supabase
    .from('monthly_closures')
    .select('*')
    .eq('id', closureId)
    .single()

  if (error || !closure) {
    throw new Error('Fechamento não encontrado')
  }

  // --------------------------------------------------
  // 🛑 Idempotência total
  // --------------------------------------------------
  if (closure.content_hash && closure.pdf_path) {
    console.log('[SCRIPT] PDF já existe. Ignorando geração.')
    return
  }

  // --------------------------------------------------
  // 2️⃣ Gerar HTML
  // --------------------------------------------------
  const html = closedReportHtml(closure)

  // --------------------------------------------------
  // 3️⃣ Gerar PDF
  // --------------------------------------------------
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdfUint8 = await page.pdf({
    format: 'A4',
    printBackground: true
  })

  await browser.close()

  const pdfBuffer = Buffer.from(pdfUint8)
  const pdfHash = generatePdfHash(pdfBuffer)

  // --------------------------------------------------
  // 4️⃣ Salvar arquivo local (opcional, auditoria)
  // --------------------------------------------------
  const localDir = path.resolve(process.cwd(), 'generated-pdfs')
  fs.mkdirSync(localDir, { recursive: true })

  const localPath = path.join(localDir, `fechamento-${closureId}.pdf`)
  fs.writeFileSync(localPath, pdfBuffer)

  // --------------------------------------------------
  // 5️⃣ Upload para Supabase Storage
  // --------------------------------------------------
  const storagePath = `closures/${closureId}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('doohplay-reports')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    })

  if (uploadError) {
    throw new Error('Falha no upload do PDF')
  }

  // --------------------------------------------------
  // 6️⃣ 🔏 ASSINATURA DEFINITIVA DO RELATÓRIO
  // --------------------------------------------------
  const { error: updateError } = await supabase
    .from('monthly_closures')
    .update({
      content_hash: pdfHash,
      finalized_at: new Date().toISOString(),
      pdf_path: storagePath,
      pdf_size: pdfBuffer.length
    })
    .eq('id', closureId)
    .is('content_hash', null) // 🔒 idempotência

  if (updateError) {
    throw new Error('Falha ao assinar o relatório')
  }

  console.log('✅ PDF gerado e assinado com sucesso')
  console.log('📄 Arquivo:', storagePath)
  console.log('🔐 Hash:', pdfHash)
}

// --------------------------------------------------
main().catch((err) => {
  console.error('❌ ERRO NA GERAÇÃO DO PDF', err)
  process.exit(1)
})
