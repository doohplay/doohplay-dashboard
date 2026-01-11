import { getSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DocumentsDashboardPage() {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('monthly_closures')
    .select(`
      id,
      report_code,
      year,
      month,
      pdf_generated_at,
      pdf_size,
      document_downloads (
        id
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DASHBOARD DOCUMENTS] erro', error)
    return <div>Erro ao carregar documentos</div>
  }

  return (
    <div style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <h1>📄 Documentos Gerados</h1>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: 24,
        }}
      >
        <thead>
          <tr>
            <th align="left">Código</th>
            <th>Período</th>
            <th>Gerado em</th>
            <th>Downloads</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {data.map((doc) => (
            <tr key={doc.id} style={{ borderTop: '1px solid #ddd' }}>
              <td>{doc.report_code}</td>

              <td align="center">
                {String(doc.month).padStart(2, '0')}/{doc.year}
              </td>

              <td align="center">
                {doc.pdf_generated_at
                  ? new Date(doc.pdf_generated_at).toLocaleString('pt-BR')
                  : '—'}
              </td>

              <td align="center">
                {doc.document_downloads?.length ?? 0}
              </td>

              <td align="center">
                <Link
                  href={`/verify/${doc.report_code}`}
                  target="_blank"
                >
                  🔎 Ver
                </Link>
                {' | '}
                <Link
                  href={`/dashboard/documents/${doc.id}/audit`}
                >
                  📊 Auditoria
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
