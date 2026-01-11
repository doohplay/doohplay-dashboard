import { createClient } from '@/lib/supabase/client'

export async function getFinancialTotalsByClosure() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vw_financial_totals_by_closure')
    .select('*')
    .order('closure_id', { ascending: false })

  if (error) throw error
  return data
}

export async function getFinancialByCampaign(closureId?: string) {
  const supabase = createClient()

  let query = supabase
    .from('vw_financial_by_campaign')
    .select('*')

  if (closureId) {
    query = query.eq('closure_id', closureId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
