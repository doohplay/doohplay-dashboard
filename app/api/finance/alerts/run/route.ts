export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()

  // 1️⃣ Registrar novos alertas
  const { data, error } = await supabase.rpc(
    'fn_register_financial_alerts'
  )

  if (error) {
    console.error('ALERT ERROR:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // 2️⃣ Buscar alertas recém-criados
  const { data: alerts } = await supabase
    .from('financial_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(data)

  // 3️⃣ Aqui você envia:
  // - email
  // - webhook
  // - Slack
  // - log externo

  console.log('ALERTS DISPARADOS:', alerts)

  return NextResponse.json({
    alerts_created: data,
  })
}
