// 🔴 OBRIGATÓRIO: forçar Node.js (React PDF não funciona no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  title: { fontSize: 16, marginBottom: 12 },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    paddingVertical: 2,
  },
  cell: { flex: 1 },
})

function FinancePdf({ data }: { data: any[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          Relatório Financeiro — DOOHPLAY
        </Text>

        <View style={styles.header}>
          <Text style={styles.cell}>Campanha</Text>
          <Text style={styles.cell}>Modelo</Text>
          <Text style={styles.cell}>Bruto</Text>
          <Text style={styles.cell}>Líquido</Text>
        </View>

        {data.map((row, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.cell}>{row.campaign_id}</Text>
            <Text style={styles.cell}>{row.pricing_model}</Text>
            <Text style={styles.cell}>{row.gross_amount}</Text>
            <Text style={styles.cell}>{row.net_amount}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vw_financial_snapshots_latest')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('PDF ERROR:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Erro ao gerar PDF' },
      { status: 500 }
    )
  }

  const buffer = await pdf(
    <FinancePdf data={data} />
  ).toBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        'attachment; filename="financeiro_snapshots.pdf"',
    },
  })
}
