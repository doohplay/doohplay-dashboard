import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { closure_id } = await req.json()

    if (!closure_id) {
      return NextResponse.json(
        { error: 'closure_id é obrigatório' },
        { status: 400 }
      )
    }

    // 🔎 Buscar fechamento (tenant + período)
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

    // 🔎 Buscar contratos válidos para o período do fechamento
    const { data: contracts, error: contractsError } = await supabase
      .from('campaign_financial_contracts')
      .select('*')
      .eq('tenant_id', closure.tenant_id)
      .lte('valid_from', closure.started_at)
      .or(`valid_to.is.null,valid_to.gte.${closure.ended_at}`)

    if (contractsError) {
      return NextResponse.json(
        { error: contractsError.message },
        { status: 500 }
      )
    }

    if (!contracts || contracts.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum contrato válido encontrado para o período' },
        { status: 404 }
      )
    }

    // 🔎 Buscar snapshots já existentes (para evitar duplicidade)
    const { data: existingSnapshots } = await supabase
      .from('monthly_financial_snapshots')
      .select('campaign_id')
      .eq('closure_id', closure_id)

    const existingCampaignIds = new Set(
      (existingSnapshots ?? []).map(s => s.campaign_id)
    )

    // 🧾 Montar inserts (somente campanhas sem snapshot)
    const inserts = contracts
      .filter(c => !existingCampaignIds.has(c.campaign_id))
      .map(c => ({
        closure_id,
        campaign_id: c.campaign_id,
        pricing_model: c.pricing_model,
        unit_price: c.unit_price,
        quantity: c.quantity,
        snapshot_version: 1,
        currency: c.currency ?? 'BRL'
      }))

    if (inserts.length === 0) {
      return NextResponse.json(
        {
          message: 'Nenhum snapshot novo a gerar',
          created: 0,
          skipped: contracts.length
        },
        { status: 200 }
      )
    }

    // 🚀 Inserção em lote
    const { data: created, error: insertError } = await supabase
      .from('monthly_financial_snapshots')
      .insert(inserts)
      .select()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    // ✅ Sucesso com resumo
    return NextResponse.json(
      {
        message: 'Snapshots gerados com sucesso',
        created: created?.length ?? 0,
        skipped: contracts.length - (created?.length ?? 0),
        snapshots: created
      },
      { status: 201 }
    )

  } catch (err) {
    return NextResponse.json(
      { error: 'Erro inesperado ao gerar snapshots em lote' },
      { status: 500 }
    )
  }
}
