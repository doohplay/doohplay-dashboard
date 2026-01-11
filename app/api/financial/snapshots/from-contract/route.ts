import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { closure_id, campaign_id } = body

    // 🔒 Validação básica
    if (!closure_id || !campaign_id) {
      return NextResponse.json(
        { error: 'closure_id e campaign_id são obrigatórios' },
        { status: 400 }
      )
    }

    // 🔎 Buscar fechamento (para pegar período + tenant)
    const { data: closure, error: closureError } = await supabase
      .from('monthly_closures')
      .select('id, tenant_id, started_at, ended_at, status')
      .eq('id', closure_id)
      .single()

    if (closureError || !closure) {
      return NextResponse.json(
        { error: 'Fechamento não encontrado' },
        { status: 404 }
      )
    }

    if (closure.status === 'finalized') {
      return NextResponse.json(
        { error: 'Fechamento já finalizado' },
        { status: 409 }
      )
    }

    // 🔎 Buscar contrato válido para o período do fechamento
    const { data: contract, error: contractError } = await supabase
      .from('campaign_financial_contracts')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('tenant_id', closure.tenant_id)
      .lte('valid_from', closure.started_at)
      .or(`valid_to.is.null,valid_to.gte.${closure.ended_at}`)
      .order('valid_from', { ascending: false })
      .limit(1)
      .single()

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Nenhum contrato financeiro válido encontrado' },
        { status: 404 }
      )
    }

    // 🧾 Criar snapshot a partir do contrato
    const { data: snapshot, error: snapshotError } = await supabase
      .from('monthly_financial_snapshots')
      .insert({
        closure_id,
        campaign_id,
        pricing_model: contract.pricing_model,
        unit_price: contract.unit_price,
        quantity: contract.quantity,
        snapshot_version: 1,
        currency: contract.currency ?? 'BRL'
      })
      .select()
      .single()

    // 🔴 Duplicidade
    if (snapshotError?.code === '23505') {
      return NextResponse.json(
        { error: 'Snapshot já existe para esta campanha e fechamento' },
        { status: 409 }
      )
    }

    if (snapshotError) {
      return NextResponse.json(
        { error: snapshotError.message },
        { status: 500 }
      )
    }

    // ✅ Sucesso
    return NextResponse.json(
      { snapshot },
      { status: 201 }
    )

  } catch (err) {
    return NextResponse.json(
      { error: 'Erro inesperado ao gerar snapshot' },
      { status: 500 }
    )
  }
}
