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

    const { data, error } = await supabase
      .from('document_downloads')
      .select('downloaded_at, ip_address, user_agent')
      .eq('closure_id', closureId)
      .order('downloaded_at', { ascending: false })

    if (error) {
      console.error('[CSV EXPORT] erro', error)
      return NextResponse.json(
        { error: 'Erro ao gerar CSV' },
        { status: 500 }
      )
    }

    // 🧾 Gerar CSV
    const header = ['data_download', 'ip', 'user_agent']
    const rows = data.map((row) => [
      row.downloaded_at,
      row.ip_address ?? '',
      `"${(row.user_agent ?? '').replace(/"/g, '""')}"`
    ])

    const csv = [
      header.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="auditoria-${closureId}.csv"`,
      },
    })
  } catch (err) {
    console.error('[CSV EXPORT] erro inesperado', err)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
