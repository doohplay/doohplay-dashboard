import { createClient } from '@/lib/supabase/client'

export async function getLatestFinancialSnapshots() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vw_financial_snapshots_latest')
    .select(`
      id,
      closure_id,
      campaign_id,
      snapshot_version,
      pricing_model,
      unit_price,
      quantity,
      gross_amount,
      net_amount,
      executions_count,
      currency,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar snapshots:', error)
    throw new Error('Erro ao carregar dados financeiros')
  }

  return data
}
