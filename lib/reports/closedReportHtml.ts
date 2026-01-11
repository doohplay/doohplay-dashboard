function formatDate(date?: string | null) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function closedReportHtml(
  closure: any,
  qrCodeBase64?: string
) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório de Fechamento</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      padding: 32px;
      color: #222;
    }

    h1 {
      text-align: center;
      margin-bottom: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: left;
      font-size: 14px;
    }

    th {
      background-color: #f5f5f5;
    }

    .footer {
      margin-top: 48px;
      text-align: center;
      font-size: 12px;
      color: #555;
    }

    .qr {
      margin-top: 16px;
    }
  </style>
</head>

<body>
  <h1>📊 Relatório de Fechamento Mensal</h1>

  <table>
    <tr>
      <th>Código do Relatório</th>
      <td>${closure.report_code}</td>
    </tr>
    <tr>
      <th>Período</th>
      <td>${closure.year}-${String(closure.month).padStart(2, '0')}</td>
    </tr>
    <tr>
      <th>Status</th>
      <td>${closure.status}</td>
    </tr>
    <tr>
      <th>Gerado em</th>
      <td>${formatDate(closure.finalized_at)}</td>
    </tr>
    <tr>
      <th>Hash do Documento</th>
      <td style="word-break: break-all;">${closure.content_hash ?? '-'}</td>
    </tr>
  </table>

  <div class="footer">
    <p><strong>Verificação de autenticidade</strong></p>

    ${
      qrCodeBase64
        ? `<div class="qr">
             <img src="${qrCodeBase64}" width="120" height="120" />
           </div>`
        : ''
    }

    <p>
      Escaneie o QR Code para validar este relatório oficialmente.
    </p>
  </div>
</body>
</html>
`
}
