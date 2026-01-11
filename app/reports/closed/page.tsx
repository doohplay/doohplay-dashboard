import { requireRole } from '@/lib/auth/requireRole'
import {
  getClosedMonths,
  getClosedReport,
} from '@/lib/reports/closedQueries'

export default async function ClosedReportsPage({
  searchParams,
}: {
  searchParams: { closure?: string }
}) {
  await requireRole(['admin', 'auditor'])

  const months = await getClosedMonths()
  const selectedId = searchParams.closure

  const report = selectedId
    ? await getClosedReport(selectedId)
    : null

  return (
    <div style={{ padding: 24 }}>
      <h1>📁 Relatórios Mensais Fechados</h1>

      {/* ================= LISTA DE MESES ================= */}
      <ul>
        {months.map((m) => (
          <li key={m.id}>
            <a href={`/reports/closed?closure=${m.id}`}>
              {m.month.toString().padStart(2, '0')}/{m.year}
            </a>
          </li>
        ))}
      </ul>

      {/* ================= RELATÓRIO ================= */}
      {report && (
        <>
          <h2 style={{ marginTop: 24 }}>
            Proof of Play — Mês Fechado
          </h2>

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
              {report.map((row) => (
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
              ))}
            </tbody>
          </table>

          {/* EXPORTS */}
          <div style={{ marginTop: 12 }}>
            <a href={`/api/reports/closed/pdf?closure=${selectedId}`}>
              Exportar PDF oficial
            </a>
            {' | '}
            <a href={`/api/reports/closed/csv?closure=${selectedId}`}>
              Exportar CSV oficial
            </a>
          </div>
        </>
      )}
    </div>
  )
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}
