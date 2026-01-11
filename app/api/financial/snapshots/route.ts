import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      closure_id,
      campaign_id,
      pricing_model,
      unit_price,
      quantity
    } = body

    // 🔒 Validação básica
    if (
      !closure_id ||
      !campaign_id ||
      !pricing_model ||
      unit_price == null ||
      quantity == null
    ) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      )
    }

    // 🔒 Inserção do snapshot
    const { data, error } = await supabase
      .from('monthly_financial_snapshots')
      .insert({
        closure_id,
        campaign_id,
        pricing_model,
        unit_price,
        quantity,
        snapshot_version: 1,
        currency: 'BRL'
      })
      .select()
      .single()

    // 🔴 Erro de duplicidade (constraint UNIQUE)
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'Snapshot financeiro já existe para esta campanha e fechamento' },
        { status: 409 }
      )
    }

    // 🔴 Qualquer outro erro do banco
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // ✅ Sucesso
    return NextResponse.json(
      { snapshot: data },
      { status: 201 }
    )

  } catch (err) {
    return NextResponse.json(
      { error: 'JSON inválido ou erro inesperado' },
      { status: 400 }
    )
  }
}
