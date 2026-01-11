import { supabase } from '@/lib/supabase/server'

export async function getClosedMonths() {
  const { data, error } = await supabase
    .from('monthly_closures')
    .select(`
      id,
      year,
      month,
      created_at,
      created_by
    `)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) throw error
  return data
}

export async function getClosedReport(closureId: string) {
  const { data, error } = await supabase
    .from('monthly_closure_items')
    .select(`
      campaign_id,
      total_plays,
      total_seconds,
      campaigns ( name )
    `)
    .eq('closure_id', closureId)

  if (error) throw error

  return data.map((row) => ({
    campaign: row.campaigns?.name ?? 'FALLBACK',
    totalPlays: row.total_plays,
    totalSeconds: row.total_seconds,
  }))
}
