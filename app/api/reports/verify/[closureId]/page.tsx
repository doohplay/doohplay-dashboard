import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function VerifyReportPage({
  params
}: {
  params: { closureId: string }
}) {
  const supabase = getSupabaseServerClient()

  const { data } = await supabase
    .from('monthly_closures')
    .select(`
      id,
      report_code,
      year,
      month,
      pdf_hash,
      pdf_generated_at,
      pdf_size
    `)
    .eq('id', params.closureId)
    .single()

  const isValid = Boolean(data?.pdf_hash)

  return (
    <main style={{ padding: 40 }}>
      <h1>{isValid ? '✅ Documento válido' : '❌ Documento inválido'}</h1>
      {isValid && (
        <>
          <p><strong>Relatório:</strong> {data.report_code}</p>
          <p><strong>Período:</strong> {`${data.year}-${String(data.month).padStart(2, '0')}`}</p>
          <p><strong>Hash:</strong> <code>{data.pdf_hash}</code></p>
        </>
      )}
    </main>
  )
}
