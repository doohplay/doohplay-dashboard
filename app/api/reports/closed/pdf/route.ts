import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import crypto from 'crypto'
import fs from 'fs'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { closedReportHtml } from '@/lib/reports/closedReportHtml'
import { buildCanonicalPayload } from '@/lib/reports/canonicalPayload'

// Ajuste se o Chrome estiver em outro caminho
const CHROME_PATH =
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

// Gera hash SHA-256 do PDF (assinatura digital)
function generatePdfHash(pdfBuffer: Buffer) {
  return crypto
    .createHash('sha256')
    .update(pdfBuffer)
    .digest('hex')
}

export async function GET(req: Request) {
  throw new Error('DEBUG_ROUTE_TS_EXECUTANDO')
  const { searchParams } = new URL(req.url)
  const closureId = searchParams.get('closureId')

  console.log('[PDF] closureId recebido:', closureId)

  if (!closureId) {
    return NextResponse.json(
      { error: 'closureId é obrigatório' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseServerClient()
  let browser: puppeteer.Browser | null = null

  try {
    // 1️⃣ Buscar payload canônico do fechamento
    const payload = await buildCanonicalPayload(closureId)

    console.log('[PDF] payload:', payload)

    if (!payload) {
      return NextResponse.json(
        { error: 'Fechamento não encontrado ou sem dados' },
        { status: 404 }
      )
    }

    // 2️⃣ Gerar HTML do relatório
    const html = closedReportHtml(payload)

    console.log('[PDF] HTML gerado (tamanho):', html.length)

    // DEBUG: salvar HTML para inspeção manual
    fs.writeFileSync('debug.html', html)

    // 3️⃣ Abrir navegador
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // 4️⃣ Injetar HTML e aguardar render
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    // DEBUG: screenshot para ver se o conteúdo existe
    await page.screenshot({ path: 'debug.png', fullPage: true })

    // 5️⃣ Gerar PDF FINAL
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

    console.log('[PDF] PDF gerado (bytes):', pdfBuffer.length)

    // 6️⃣ Gerar hash do PDF
    const pdfHash = generatePdfHash(pdfBuffer)
    console.log('[PDF] hash gerado:', pdfHash)

    // 7️⃣ Salvar hash e data no fechamento
    const { data, error } = await supabase
      .from('monthly_closures')
      .update({
        pdf_hash: pdfHash,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', closureId)
      .select('id')

    if (error) {
      console.error('[PDF] erro ao salvar hash:', error)
    }

    if (!data || data.length === 0) {
      console.error(
        '[PDF] nenhum fechamento atualizado — verifique closureId ou RLS'
      )
    }

    // 8️⃣ Auditoria da geração do PDF
    await supabase.rpc('fn_audit_event', {
      p_action: 'PDF_GENERATED',
      p_entity: 'monthly_closures',
      p_entity_id: closureId,
      p_metadata: {
        pdf_hash: pdfHash,
        source: 'reports/closed/pdf',
      },
    })

    // 9️⃣ Retornar PDF para o cliente
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="fechamento-${closureId}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[PDF ERROR]', err)
    return NextResponse.json(
      { error: 'Erro inesperado ao gerar PDF' },
      { status: 500 }
    )
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
