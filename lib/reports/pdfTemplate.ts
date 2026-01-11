type Period = '7' | '30' | 'month'

export function proofOfPlayHtml(
  data: any[],
  period: Period
) {
  const periodLabel =
    period === '7'
      ? 'Últimos 7 dias'
      : period === '30'
      ? 'Últimos 30 dias'
      : 'Mês fechado'

  const rows = data
    .map(
      (r) => `
      <tr>
        <td>${r.campaign}</td>
        <td style="text-align:right;">${r.totalPlays}</td>
        <td style="text-align:right;">${r.totalSeconds}</td>
        <td style="text-align:right;">${formatTime(r.totalSeconds)}</td>
      </tr>
    `
    )
    .join('')

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Proof of Play — Por Campanha</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          margin: 0;
          padding: 20px;
        }

        h1 {
          font-size: 18px;
          margin-bottom: 4px;
        }

        p {
          margin: 0 0 12px 0;
          color: #555;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }

        th, td {
          border: 1px solid #ccc;
          padding: 6px;
        }

        th {
          background: #f5f5f5;
          text-align: left;
        }

        footer {
          position: fixed;
          bottom: 10px;
          left: 0;
          right: 0;
          font-size: 9px;
          color: #777;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>Proof of Play — Por Campanha</h1>
      <p>${periodLabel}</p>

      <table>
        <thead>
          <tr>
            <th>Campanha</th>
            <th>Total de plays</th>
            <th>Tempo total (s)</th>
            <th>Tempo total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <footer>
        Gerado em ${new Date().toUTCString()} ·
        Fonte: playback_logs ·
        Logs certificados (SHA-256)
      </footer>
    </body>
  </html>
  `
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return `${h}h ${m}m ${s}s`
}
