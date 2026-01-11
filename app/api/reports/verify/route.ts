import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const closureId = searchParams.get('closureId')

  if (!closureId) {
    return NextResponse.json(
      { valid: false, error: 'closureId ausente' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('monthly_closures')
    .select(`
      id,
      report_code,
      year,
      month,
      pdf_hash,
      pdf_generated_at,
      pdf_path,
      pdf_size
    `)
    .eq('id', closureId)
    .single()

  if (error || !data || !data.pdf_hash) {
    return NextResponse.json(
      { valid: false },
      { status: 404 }
    )
  }

  return NextResponse.json({
    valid: true,
    document: {
      type: 'MONTHLY_CLOSURE',
      report_code: data.report_code,
      period: `${data.year}-${String(data.month).padStart(2, '0')}`,
      generated_at: data.pdf_generated_at,
      hash: data.pdf_hash,
      size: data.pdf_size
    }
  })
}
