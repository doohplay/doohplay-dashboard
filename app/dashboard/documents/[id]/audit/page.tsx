import { getSupabaseServerClient } from '@/lib/supabase/server'

interface PageProps {
  params: { id: string }
}

export default async function DocumentAuditPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient()

  console.log('[AUDIT PAGE] closure_id =', params.id)

  const { data, error } = await supabase
    .from('document_downloads')
    .select(`
      id,
      downloaded_at,
      ip_address,
      user_agent
    `)
    .eq('closure_id', params.id)
    .order('downloaded_at', { ascending: false })

  if (error) {
    console.error('[AUDIT PAGE] erro ao buscar auditoria', error)

    return (
      <div style={{ padding: 32 }}>
        <h1>❌ Erro interno</h1>
        <p>Não foi possível carregar a auditoria do documento.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 Auditoria de Downloads</h1>

      <p>
        Documento (closure_id): <strong>{params.id}</strong>
      </p>

      {(!data || data.length === 0) && (
        <p>Nenhum download registrado.</p>
      )}

      {data && data.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: 24,
          }}
        >
          <thead>
            <tr>
              <th align="left">Data</th>
              <th align="left">IP</th>
              <th align="left">User-Agent</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr key={row.id} style={{ borderTop: '1px solid #ddd' }}>
                <td>
                  {row.downloaded_at
                    ? new Date(row.downloaded_at).toLocaleString('pt-BR')
                    : '—'}
                </td>
                <td>{row.ip_address ?? '—'}</td>
                <td
                  title={row.user_agent ?? ''}
                  style={{
                    maxWidth: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.user_agent ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
