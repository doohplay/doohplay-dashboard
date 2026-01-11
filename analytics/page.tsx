import { getSupabaseServerClient } from '@/lib/supabase/server'
import DownloadsChart from './DownloadsChart'

export default async function AnalyticsPage() {
  const supabase = getSupabaseServerClient()

  // 🔢 Agregar downloads por dia
  const { data, error } = await supabase
    .from('document_downloads')
    .select('downloaded_at')

  if (error) {
    console.error('[ANALYTICS] erro', error)
    return <div>Erro ao carregar analytics</div>
  }

  // 📊 Agrupamento manual (server-side)
  const map: Record<string, number> = {}

  for (const row of data) {
    const day = new Date(row.downloaded_at)
      .toISOString()
      .slice(0, 10) // YYYY-MM-DD
    map[day] = (map[day] || 0) + 1
  }

  const labels = Object.keys(map).sort()
  const values = labels.map((l) => map[l])

  return (
    <div style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <h1>📈 Downloads por Dia</h1>

      {labels.length === 0 ? (
        <p>Nenhum download registrado.</p>
      ) : (
        <div style={{ maxWidth: 800 }}>
          <DownloadsChart labels={labels} values={values} />
        </div>
      )}
    </div>
  )
}
