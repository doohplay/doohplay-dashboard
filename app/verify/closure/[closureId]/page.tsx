// 🔥 FORÇAR EXECUÇÃO DINÂMICA (SEM CACHE)
export const dynamic = 'force-dynamic'
export const revalidate = 0

console.log('>>> VERIFY CLOSURE PAGE EXECUTED <<<')

import { createClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{ closureId: string }>
  searchParams: Promise<{ hash?: string }>
}

export default async function VerifyClosurePage({
  params,
  searchParams,
}: PageProps) {
  const { closureId } = await params
  const { hash: providedHash } = await searchParams

  console.log('PARAMS:', closureId)
  console.log('HASH:', providedHash)

  if (!closureId || !providedHash) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Documento inválido</h1>
        <p>Identificador ou hash ausente.</p>
      </main>
    )
  }

  const supabase = createClient()

  const { data, error } = await supabase.rpc(
    'fn_get_closure_public_verification',
    {
      p_closure_id: closureId,
    }
  )

  console.log('RPC ERROR:', error)
  console.log('RPC DATA RAW:', data)
  console.log('IS ARRAY:', Array.isArray(data))

  if (error || !data) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Documento não encontrado</h1>
        <p>O fechamento informado não existe ou não está publicado.</p>
      </main>
    )
  }

  // ✅ Normalizar retorno (objeto OU array)
  const closure = Array.isArray(data) ? data[0] : data

  console.log('CLOSURE NORMALIZED:', closure)

  if (!closure) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Documento não encontrado</h1>
        <p>O fechamento informado não existe ou não está publicado.</p>
      </main>
    )
  }

  // 🔐 Validação FINAL do hash
  if (closure.closure_hash !== providedHash) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Documento inválido</h1>
        <p>O hash informado não corresponde ao documento assinado.</p>
      </main>
    )
  }

  // ✅ Documento válido
  return (
    <main style={{ padding: 32 }}>
      <h1>Documento válido</h1>

      <p>
        <strong>Referência:</strong> {closure.reference_month}
      </p>

      <p>
        <strong>Assinado em:</strong>{' '}
        {new Date(closure.signed_at).toLocaleString()}
      </p>

      <h2>Campanhas</h2>

      <pre>{JSON.stringify(closure.campaigns, null, 2)}</pre>
    </main>
  )
}
