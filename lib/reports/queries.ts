import { supabase } from '@/lib/supabase/server'

type Period = '7' | '30' | 'month'

function getDateRange(params: {
  period?: Period
  start?: string
  end?: string
}) {
  // 🎯 Customizado tem prioridade
  if (params.start && params.end) {
    return {
      from: new Date(params.start + 'T00:00:00Z'),
      to: new Date(params.end + 'T23:59:59Z'),
      label: `Período customizado: ${params.start} → ${params.end}`,
    }
  }

  const now = new Date()

  if (params.period === '7') {
    const from = new Date(now)
    from.setDate(from.getDate() - 7)
    return { from, to: now, label: 'Últimos 7 dias' }
  }

  if (params.period === '30') {
    const from = new Date(now)
    from.setDate(from.getDate() - 30)
    return { from, to: now, label: 'Últimos 30 dias' }
  }

  // month fechado (mês atual)
  const from = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1,
    0, 0, 0
  ))
  return { from, to: now, label: 'Mês fechado' }
}

export async function getProofOfPlay(params: {
  period?: Period
  start?: string
  end?: string
}) {
  const { from, to, label } = getDateRange(params)

  const { data, error } = await supabase
    .from('playback_logs')
    .select(`
      campaign_id,
      duration_seconds,
      campaigns ( name )
    `)
    .gte('started_at', from.toISOString())
    .lte('started_at', to.toISOString())

  if (error) throw error

  const map: Record<string, any> = {}

  for (const row of data) {
    const name = row.campaigns?.name ?? 'FALLBACK'

    map[name] ??= {
      campaign: name,
      totalSeconds: 0,
      totalPlays: 0,
    }

    map[name].totalSeconds += row.duration_seconds
    map[name].totalPlays += 1
  }

  return {
    label,
    data: Object.values(map).sort(
      (a, b) => b.totalSeconds - a.totalSeconds
    ),
  }
}
