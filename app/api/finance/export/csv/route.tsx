import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vw_financial_snapshots_latest')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('CSV ERROR:', error) // 👈 LOG REAL
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'Nenhum dado encontrado' },
      { status: 404 }
    )
  }

  const header = Object.keys(data[0]).join(';')
  const rows = data.map(row =>
    Object.values(row).join(';')
  )

  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="financeiro_snapshots.csv"',
    },
  })
}
