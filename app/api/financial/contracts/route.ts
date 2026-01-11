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
      tenant_id,
      campaign_id,
      pricing_model,
      unit_price,
      quantity,
      currency,
      valid_from,
      valid_to
    } = body

    // 🔒 Validação obrigatória
    if (
      !tenant_id ||
      !campaign_id ||
      !pricing_model ||
      unit_price == null ||
      quantity == null ||
      !valid_from
    ) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      )
    }

    // 🔒 Inserção do contrato
    const { data, error } = await supabase
      .from('campaign_financial_contracts')
      .insert({
        tenant_id,
        campaign_id,
        pricing_model,
        unit_price,
        quantity,
        currency: currency ?? 'BRL',
        valid_from,
        valid_to
      })
      .select()
      .single()

    // 🔴 Duplicidade
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'Contrato financeiro já existe para esta campanha e período' },
        { status: 409 }
      )
    }

    // 🔴 Erro genérico
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // ✅ Sucesso
    return NextResponse.json(
      { contract: data },
      { status: 201 }
    )

  } catch (err) {
    return NextResponse.json(
      { error: 'JSON inválido ou erro inesperado' },
      { status: 400 }
    )
  }
}
