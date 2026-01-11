// 🔴 OBRIGATÓRIO: runtime Node.js
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

import { closedReportHtml } from '@/lib/reports/closedReportHtml'
import { buildCanonicalPayload } from '@/lib/reports/canonicalPayload'

const CHROME_PATH =
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

// Hash SHA-256 do PDF
function generatePdfHash(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const closureId = searchParams.get('closureId')

  console.log('[API] /api/reports/pdf EXECUTANDO')

  if (!closureId) {
    return NextResponse.json(
      { error: 'closureId é obrigatório' },
      { status: 400 }
    )
  }

  // 🔐 CRIAÇÃO EXPLÍCITA DO CLIENT (SEM HELPER)
  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  })

  let browser: puppeteer.Browser | null = null

  try {
    // 1️⃣ Payload do fechamento
    const payload = await buildCanonicalPayload(closureId)
    if (!payload) {
      return NextResponse.json(
        { error: 'Fechamento não encontrado' },
        { status: 404 }
      )
    }

    // 2️⃣ HTML
    const html = closedReportHtml(payload)

    // 3️⃣ Puppeteer
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    // 4️⃣ PDF
    const pdfBuffer = Buffer.from(
      await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      })
    )

    // 5️⃣ Hash
    const pdfHash = generatePdfHash(pdfBuffer)

    // 6️⃣ UPDATE DEFINITIVO
    const { error } = await supabase
      .from('monthly_closures')
      .update({
        pdf_hash: pdfHash,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', closureId)

    if (error) {
      console.error('[PDF] ERRO AO GRAVAR HASH', error)
      throw new Error('Falha ao gravar pdf_hash')
    }

    console.log('[PDF] HASH GRAVADO COM SUCESSO')

    // 7️⃣ Retorno
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="fechamento-${closureId}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[PDF ERROR]', err)
    return NextResponse.json(
      { error: 'Erro ao gerar PDF' },
      { status: 500 }
    )
  } finally {
    if (browser) await browser.close()
  }
}
