import { getSupabaseServerClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{
    code: string
  }>
}

export default async function VerifyReportPage({ params }: PageProps) {
  // ✅ Next.js 16: params é Promise
  const { code } = await params

  console.log('[VERIFY PAGE] code recebido =', code)

  if (!code) {
    return (
      <div style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
        <h1>❌ Código inválido</h1>
        <p>O código do documento não foi informado.</p>
      </div>
    )
  }

  const supabase = getSupabaseServerClient()
  const search = code.trim()

  // ✅ BUSCA DEFINITIVA (UUID ou report_code, com versionamento)
  const { data, error } = await supabase
    .from('monthly_closures')
    .select(`
      id,
      report_code,
      year,
      month,
      created_at,
      pdf_hash,
      pdf_path,
      pdf_size,
      pdf_generated_at
    `)
    // ⚠️ IMPORTANTE: string em UMA linha (sem \n)
    .or(`report_code.ilike.%${search}%,id.eq.${search}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    console.error('[VERIFY PAGE] erro ao buscar fechamento', error)

    return (
      <div style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
        <h1>❌ Relatório não encontrado</h1>
        <p>Verifique o código informado.</p>
      </div>
    )
  }

  // 🔗 Link assinado do PDF
  let signedUrl: string | null = null

  if (data.pdf_path) {
    const { data: signed, error: signError } =
      await supabase.storage
        .from('doohplay-reports')
        .createSignedUrl(data.pdf_path, 300)

    if (!signError) {
      signedUrl = signed.signedUrl
    } else {
      console.error('[VERIFY PAGE] erro ao gerar link assinado', signError)
    }
  }

  return (
    <div
      style={{
        padding: 32,
        fontFamily: 'Arial, sans-serif',
        maxWidth: 720,
        margin: '0 auto'
      }}
    >
      <h1>📄 Documento verificado</h1>

      <p>
        <strong>Código:</strong> {data.report_code}
      </p>

      <p>
        <strong>Período:</strong>{' '}
        {String(data.month).padStart(2, '0')}/{data.year}
      </p>

      <p>
        <strong>Gerado em:</strong>{' '}
        {data.pdf_generated_at
          ? new Date(data.pdf_generated_at).toLocaleString('pt-BR')
          : '—'}
      </p>

      <p>
        <strong>Hash (SHA-256):</strong>
        <br />
        <code style={{ wordBreak: 'break-all' }}>{data.pdf_hash}</code>
      </p>

      <p>
        <strong>Tamanho:</strong>{' '}
        {data.pdf_size
          ? `${(data.pdf_size / 1024).toFixed(1)} KB`
          : '—'}
      </p>

      {signedUrl ? (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 24,
            padding: '12px 20px',
            background: '#0f172a',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 6
          }}
        >
          ⬇️ Baixar PDF
        </a>
      ) : (
        <p style={{ marginTop: 24, color: '#b91c1c' }}>
          ❌ PDF não disponível
        </p>
      )}
    </div>
  )
}
