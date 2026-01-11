import { getProofOfPlay } from '@/lib/reports/queries'
import { requireRole } from '@/lib/auth/requireRole'
import { DatePicker } from '@/components/reports/DatePicker'

type Period = '7' | '30' | 'month'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: {
    period?: Period
    start?: string
    end?: string
  }
}) {
  // 🔐 Controle de acesso
  const role = await requireRole(['admin', 'auditor', 'viewer'])

  // 🎯 Dados do relatório
  const { data, label } = await getProofOfPlay({
    period: searchParams.period,
    start: searchParams.start,
    end: searchParams.end,
  })

  const params = new URLSearchParams(
    Object.entries(searchParams)
      .filter(([, v]) => v !== undefined) as [string, string][]
  ).toString()

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h1>📊 Proof of Play — Por Campanha</h1>
        <p>Nenhum log encontrado para o período selecionado.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      {/* ================= HEADER ================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
          gap: 16,
        }}
      >
        {/* Título */}
        <div>
          <h1 style={{ marginBottom: 4 }}>
            📊 Proof of Play — Por Campanha
          </h1>
          <p style={{ color: '#666', margin: 0 }}>{label}</p>
        </div>

        {/* Controles */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {/* Presets */}
          <a href="/reports?period=7">7 dias</a>
          <a href="/reports?period=30">30 dias</a>
          <a href="/reports?period=month">Mês fechado</a>

          <DatePicker />

          {/* Exports */}
          {(role === 'admin' || role === 'auditor') && (
            <>
              <a href={`/api/reports/csv?${params}`}>
                Exportar CSV
              </a>
              <a href={`/api/reports/pdf?${params}`}>
                Exportar PDF
              </a>
            </>
          )}

          {/* 🔒 Fechamento mensal (APENAS ADMIN) */}
          {role === 'admin' && (
            <form
              action="/api/closures/close-month"
              method="post"
              style={{ display: 'inline', marginLeft: 12 }}
              onSubmit={(e) => {
                if (
                  !confirm(
                    'Fechar o mês? Esta ação é irreversível.'
                  )
                ) {
                  e.preventDefault()
                }
              }}
            >
              <input
                type="hidden"
                name="year"
                value={new Date().getUTCFullYear()}
              />
              <input
                type="hidden"
                name="month"
                value={new Date().getUTCMonth() + 1}
              />

              <button
                type="submit"
                style={{
                  padding: '6px 10px',
                  borderRadius: 4,
                  background: '#b91c1c',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                🔒 Fechar mês
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ================= TABELA ================= */}
      <table
        border={1}
        cellPadding={8}
        style={{ width: '100%' }}
      >
        <thead>
          <tr>
            <th>Campanha</th>
            <th>Total de plays</th>
            <th>Tempo total (s)</th>
            <th>Tempo total</th>
          </tr>
        </thead>
        <tbody>
          {data.map(
            (row: {
              campaign: string
              totalPlays: number
              totalSeconds: number
            }) => (
              <tr key={row.campaign}>
                <td>{row.campaign}</td>
                <td style={{ textAlign: 'right' }}>
                  {row.totalPlays}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {row.totalSeconds}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {formatTime(row.totalSeconds)}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {/* ================= RODAPÉ ================= */}
      <footer
        style={{
          marginTop: 24,
          fontSize: 12,
          color: '#888',
        }}
      >
        Dados gerados em {new Date().toUTCString()} ·
        Fonte: playback_logs ·
        Logs certificados (SHA-256)
      </footer>
    </div>
  )
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}
