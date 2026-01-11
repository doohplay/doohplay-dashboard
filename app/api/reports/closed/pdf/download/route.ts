import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServerClient()
    const { searchParams } = new URL(req.url)

    const closureId = searchParams.get('closureId')

    if (!closureId) {
      return NextResponse.json(
        { error: 'closureId é obrigatório' },
        { status: 400 }
      )
    }

    // 1️⃣ Buscar dados do documento
    const { data: closure, error: closureError } = await supabase
      .from('monthly_closures')
      .select('id, pdf_path')
      .eq('id', closureId)
      .single()

    if (closureError || !closure?.pdf_path) {
      console.error('[DOWNLOAD] erro ao buscar fechamento', closureError)
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    // 2️⃣ Registrar auditoria do download
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      null

    const userAgent = req.headers.get('user-agent')

    const { error: auditError } = await supabase
      .from('document_downloads')
      .insert({
        closure_id: closure.id,
        downloaded_at: new Date().toISOString(),
        ip_address: ip,
        user_agent: userAgent,
      })

    if (auditError) {
      console.error('[DOWNLOAD] erro ao registrar auditoria', auditError)
      // não bloqueia o download
    }

    // 3️⃣ Gerar URL assinada
    const { data: signed, error: signError } = await supabase.storage
      .from('doohplay-reports')
      .createSignedUrl(closure.pdf_path, 300)

    if (signError || !signed?.signedUrl) {
      console.error('[DOWNLOAD] erro ao gerar signed URL', signError)
      return NextResponse.json(
        { error: 'Erro ao gerar link de download' },
        { status: 500 }
      )
    }

    // 4️⃣ Redirecionar para o PDF
    return NextResponse.redirect(signed.signedUrl)
  } catch (err) {
    console.error('[DOWNLOAD] erro inesperado', err)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
