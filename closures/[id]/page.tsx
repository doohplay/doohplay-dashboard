import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ClosureDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = getSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  // 🔎 Buscar fechamento
  const { data: closure, error } = await supabase
    .from('monthly_closures')
    .select(`
      id,
      report_code,
      year,
      month,
      status,
      pdf_path,
      pdf_hash,
      pdf_size,
      pdf_generated_at
    `)
    .eq('id', params.id)
    .single()

  if (error || !closure) {
    return <h1>❌ Fechamento não encontrado</h1>
  }

  // 📊 Downloads
  const { count: downloadCount } = await supabase
    .from('document_downloads')
    .select('*', { count: 'exact', head: true })
    .eq('closure_id', closure.id)

  // 🔐 Gerar URL assinada
  let signedUrl: string | null = null

  if (closure.pdf_path) {
    const { data } = await supabase.storage
      .from('doohplay-reports')
      .createSignedUrl(closure.pdf_path, 60)

    signedUrl = data?.signedUrl ?? null
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>📄 Fechamento {closure.report_code}</h1>

      <p>
        Período:{' '}
        <strong>
          {String(closure.month).padStart(2, '0')}/{closure.year}
        </strong>
      </p>

      <p>Status: <strong>{closure.status}</strong></p>

      <hr />

      <h2>📑 PDF</h2>

      {closure.pdf_generated_at ? (
        <>
          <p>Gerado em: {new Date(closure.pdf_generated_at).toLocaleString('pt-BR')}</p>
          <p>Tamanho: {(closure.pdf_size / 1024).toFixed(1)} KB</p>
          <p>Hash: <code>{closure.pdf_hash}</code></p>

          {signedUrl && (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️ Baixar PDF
            </a>
          )}
        </>
      ) : (
        <p>⏳ PDF ainda não gerado</p>
      )}

      <hr />

      <h2>🔍 Auditoria</h2>
      <p>Total de downloads: <strong>{downloadCount ?? 0}</strong></p>

      <p>
        Link público:{' '}
        <a href={`/verify/${closure.report_code}`} target="_blank">
          /verify/{closure.report_code}
        </a>
      </p>
    </div>
  )
}
