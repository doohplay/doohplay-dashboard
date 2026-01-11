import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DocumentAuditPage({
  params,
}: {
  params: Promise<{ closureId: string }>
}) {
  const { closureId } = await params
  const supabase = getSupabaseServerClient()

  // 🔐 Autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.app_metadata?.role
  if (!['admin', 'financeiro'].includes(role)) {
    return (
      <div style={{ padding: 32 }}>
        <h1>🚫 Acesso negado</h1>
      </div>
    )
  }

  // 📄 Dados do documento
  const { data: document } = await supabase
    .from('monthly_closures')
    .select('id, report_code, year, month')
    .eq('id', closureId)
    .single()

  if (!document) {
    return (
      <div style={{ padding: 32 }}>
        <h1>❌ Documento não encontrado</h1>
      </div>
    )
  }

  // 📊 Auditoria de downloads
  const { data: downloads, error } = await supabase
    .from('document_downloads')
    .select(`
      id,
      downloaded_at,
      ip_address,
      user_agent,
      origin
    `)
    .eq('closure_id', closureId)
    .order('downloaded_at', { ascending: false })

  if (error) {
    return <pre>{JSON.stringify(error, null, 2)}</pre>
  }

  return (
    <div style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <h1>🔎 Auditoria de Downloads</h1>

      <p>
        <strong>Relatório:</strong> {document.report_code}
      </p>

      <p>
        <strong>Período:</strong> {document.month}/{document.year}
      </p>

      <p>
        <strong>Total de downloads:</strong> {downloads.length}
      </p>

      <hr style={{ margin: '24px 0' }} />

      {downloads.length === 0 ? (
        <p>⚠️ Nenhum download registrado.</p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr>
              <th align="left">Data / Hora</th>
              <th align="left">IP</th>
              <th align="left">Origem</th>
              <th align="left">User-Agent</th>
            </tr>
          </thead>

          <tbody>
            {downloads.map((d) => (
              <tr key={d.id}>
                <td>
                  {new Date(d.downloaded_at).toLocaleString('pt-BR')}
                </td>
                <td>{d.ip_address ?? '—'}</td>
                <td>{d.origin ?? '—'}</td>
                <td
                  style={{
                    maxWidth: 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={d.user_agent}
                >
                  {d.user_agent ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
