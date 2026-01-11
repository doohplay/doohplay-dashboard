export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ closureId: string }> }
) {
  try {
    const { closureId } = await params
    const supabase = createClient()

    /* =========================================================
       1️⃣ BUSCAR DADOS DO FECHAMENTO (SEM .single())
    ========================================================= */
    const { data, error } = await supabase.rpc(
      'fn_get_closure_pdf_data',
      { p_closure_id: closureId }
    )

    if (error || !data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Fechamento não encontrado ou não assinado' }),
        { status: 404 }
      )
    }

    const closure = data[0]

    /* =========================================================
       2️⃣ FONTE (OBRIGATÓRIA)
    ========================================================= */
    const fontPath = path.join(
      process.cwd(),
      'assets',
      'fonts',
      'Roboto-Regular.ttf'
    )

    if (!fs.existsSync(fontPath)) {
      throw new Error(`Fonte não encontrada: ${fontPath}`)
    }

    /* =========================================================
       3️⃣ CRIAR PDF (FIX DEFINITIVO DO HELVETICA)
    ========================================================= */
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      autoFirstPage: false,
      font: fontPath, // 🔴 FIX REAL
    })

    // criar página APÓS o construtor
    doc.addPage()

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))

    const pdfReady = new Promise<void>((resolve, reject) => {
      doc.on('end', resolve)
      doc.on('error', reject)
    })

    /* =========================================================
       4️⃣ CONTEÚDO DO PDF
    ========================================================= */
    doc.fontSize(18).text('Relatório Financeiro — DOOHPLAY', {
      align: 'center',
    })

    doc.moveDown(1.5)
    doc.fontSize(12)
    doc.text(`Fechamento ID: ${closure.closure_id}`)
    doc.text(`Referência: ${closure.reference}`)
    doc.text(
      `Assinado em: ${new Date(closure.signed_at).toLocaleString('pt-BR')}`
    )

    doc.moveDown()
    doc.fontSize(10).text('Hash de integridade:')
    doc.text(closure.closure_hash)

    doc.moveDown(1.5)
    doc.fontSize(14).text('Campanhas')
    doc.moveDown(0.5)

    let totalLiquido = 0

    for (const c of closure.campaigns) {
      doc.fontSize(11).text(
        `Campanha: ${c.campaign_id}
Bruto: R$ ${Number(c.gross_amount).toFixed(2)}
Líquido: R$ ${Number(c.net_amount).toFixed(2)}
Execuções: ${c.executions_count}`
      )
      doc.moveDown(0.5)
      totalLiquido += Number(c.net_amount)
    }

    doc.moveDown(1.5)
    doc
      .fontSize(14)
      .text(`Total Líquido: R$ ${totalLiquido.toFixed(2)}`, {
        align: 'right',
      })

    /* =========================================================
       5️⃣ QR CODE
    ========================================================= */
    const verifyUrl =
      `${process.env.NEXT_PUBLIC_BASE_URL}` +
      `/verify/closure/${closure.closure_id}` +
      `?hash=${closure.closure_hash}`

    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      type: 'png',
      width: 140,
      margin: 1,
    })

    doc.image(
      qrBuffer,
      doc.page.width - 190,
      doc.page.height - 220,
      { width: 140 }
    )

    doc
      .fontSize(8)
      .text(
        'Verifique a autenticidade',
        doc.page.width - 190,
        doc.page.height - 70,
        { width: 140, align: 'center' }
      )

    doc.end()
    await pdfReady

    const pdfBuffer = Buffer.concat(chunks)

    /* =========================================================
       6️⃣ SALVAR NO STORAGE
    ========================================================= */
    const filePath = `closures/closure-${closureId}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('finance-reports')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) throw uploadError

    /* =========================================================
       7️⃣ METADADOS
    ========================================================= */
    await supabase
      .from('financial_closures')
      .update({
        pdf_path: filePath,
        pdf_hash: closure.closure_hash,
        pdf_generated_at: new Date().toISOString(),
        pdf_size: pdfBuffer.length,
      })
      .eq('id', closureId)

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=closure-${closureId}.pdf`,
      },
    })
  } catch (err: any) {
    console.error('PDF ERROR FINAL:', err)

    return new Response(
      JSON.stringify({
        error: 'Erro ao gerar PDF',
        details: err?.message ?? String(err),
      }),
      { status: 500 }
    )
  }
}
