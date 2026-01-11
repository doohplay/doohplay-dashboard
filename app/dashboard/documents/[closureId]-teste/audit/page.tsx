import { getSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

type AuditRow = {
  id: string
  created_at: string
  ip_address: string | null
  user_agent: string | null
  user_id: string | null
}

export default async function DocumentAuditPage({
  params,
}: {
  params: { closureId: string }
}) {
  const supabase = getSupabaseServerClient()
  const closureId = params.closureId

  /* 📄 Documento */
  const { data: document, error: docError } = await supabase
    .from('monthly_closures')
    .select('id, report_code, year, month')
    .eq('id', closureId)
    .single()

  if (docError || !document) {
    return notFound()
  }

  /* 📥 Auditoria de downloads */
  const { data: downloads, error } = await supabase
    .from('document_downloads')
    .select(
      `
        id,
        created_at,
        ip_address,
        user_agent,
        user_id
      `
    )
    .eq('closure_id', closureId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[AUDIT PAGE] Erro ao buscar downloads', error)
  }

  return (
    <div style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 Auditoria de Downloads</h1>

      <p>
        <strong>Documento:</strong> {document.report_code}
        <br />
        <strong>Período:</strong>{' '}
        {document.year}-{String(document.month).padStart(2, '0')}
      </p>

      <p>
        <strong>Total de downloads:</strong> {downloads?.length ?? 0}
      </p>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: 24,
        }}
      >
        <thead>
          <tr>
            <th style={th}>Data</th>
            <th style={th}>Usuário</th>
            <th style={th}>IP</th>
            <th style={th}>Navegador</th>
          </tr>
        </thead>

        <tbody>
          {downloads?.map((d: AuditRow) => (
            <tr key={d.id}>
              <td style={td}>
                {new Date(d.created_at).toLocaleString('pt-BR')}
              </td>

              <td style={td}>{d.user_id ?? 'Público'}</td>

              <td style={td}>{d.ip_address ?? '—'}</td>

              <td style={td} title={d.user_agent ?? ''}>
                {d.user_agent
                  ? d.user_agent.slice(0, 60) + '…'
                  : '—'}
              </td>
            </tr>
          ))}

          {downloads?.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 16, textAlign: 'center' }}>
                Nenhum download registrado
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p style={{ marginTop: 24 }}>
        <a href="/dashboard/documents">← Voltar para documentos</a>
      </p>
    </div>
  )
}

/* 🎨 Estilos */
const th: React.CSSProperties = {
  borderBottom: '1px solid #ccc',
  padding: 8,
  textAlign: 'left',
}

const td: React.CSSProperties = {
  borderBottom: '1px solid #eee',
  padding: 8,
}
