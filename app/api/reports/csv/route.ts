import { NextResponse } from 'next/server'
import { getProofOfPlay } from '@/lib/reports/queries'
import { requireRole } from '@/lib/auth/requireRole'

export const runtime = 'nodejs' // garante Node (não Edge)

export async function GET(req: Request) {
  // 🔐 Controle de acesso (OBRIGATÓRIO)
  await requireRole(['admin', 'auditor'])

  const { searchParams } = new URL(req.url)

  // aceita: period | start | end
  const params = {
    period: searchParams.get('period') ?? undefined,
    start: searchParams.get('start') ?? undefined,
    end: searchParams.get('end') ?? undefined,
  }

  const result = await getProofOfPlay(params)
  const data = result.data
  const label = result.label

  const header = [
    'campaign',
    'total_plays',
    'total_seconds',
  ]

  const rows = data.map((r: any) => [
    r.campaign,
    r.totalPlays,
    r.totalSeconds,
  ])

  const csv = [
    header.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="proof-of-play-${label.replace(
        /\s+/g,
        '-'
      )}.csv"`,
    },
  })
}
