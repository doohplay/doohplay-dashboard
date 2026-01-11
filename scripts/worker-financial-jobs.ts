/**
 * Worker financeiro – processamento de jobs assíncronos
 * Compatível com PM2 + Windows (sem npx)
 */

import dotenv from 'dotenv'
dotenv.config({
  path: 'C:/DOOHPLAY/dashboard/.env',
  override: true,
})

import { createClient } from '@supabase/supabase-js'
import { execFile } from 'child_process'
import { randomUUID } from 'crypto'
import path from 'path'

// ─────────────────────────────────────────────
// 🔒 Fail-fast de ENV
// ─────────────────────────────────────────────
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos')
}

// ─────────────────────────────────────────────
// 🔐 Supabase client (service_role)
// ─────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─────────────────────────────────────────────
// ⚙️ Configurações do worker
// ─────────────────────────────────────────────
const WORKER_ID = randomUUID()
const POLL_INTERVAL_MS = 5000
const MAX_ATTEMPTS = 3
const STUCK_JOB_MINUTES = 15

console.log(`[WORKER ${WORKER_ID}] Iniciado`)

// Caminho absoluto do ts-node (NUNCA usar npx em worker)
const tsNodeBin = path.resolve(
  'node_modules/ts-node/dist/bin.js'
)

// ─────────────────────────────────────────────
// ♻️ Reenfileirar jobs travados
// ─────────────────────────────────────────────
async function requeueStuckJobs() {
  const limitDate = new Date(
    Date.now() - STUCK_JOB_MINUTES * 60 * 1000
  ).toISOString()

  const { error } = await supabase
    .from('financial_jobs')
    .update({ status: 'pending' })
    .eq('status', 'processing')
    .lt('started_at', limitDate)

  if (error) {
    console.error('[WORKER] Erro ao reprocessar jobs travados', error)
  }
}

// ─────────────────────────────────────────────
// ▶️ Processar um job por vez
// ─────────────────────────────────────────────
async function processJob() {
  const { data: jobs, error } = await supabase.rpc(
    'fn_claim_financial_job',
    { p_worker_id: WORKER_ID }
  )

  if (error) {
    console.error('[WORKER] Erro ao buscar job', error)
    return
  }

  if (!jobs || jobs.length === 0) return

  const job = jobs[0]
  const closureId = job.payload?.closure_id

  if (!closureId) {
    console.error('[WORKER] Job inválido', job.id)
    return
  }

  console.log(`[WORKER] Job ${job.id} → fechamento ${closureId}`)

  // 🛡️ Idempotência
  const { data: closure } = await supabase
    .from('monthly_closures')
    .select('pdf_hash')
    .eq('id', closureId)
    .single()

  if (closure?.pdf_hash) {
    console.log('[WORKER] PDF já existe, pulando job', job.id)

    await supabase
      .from('financial_jobs')
      .update({
        status: 'done',
        processed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return
  }

  // ▶️ Executa o script de geração de PDF
  execFile(
    'node',
    [
      tsNodeBin,
      '-P',
      'tsconfig.scripts.json',
      'scripts/generate-closure-pdf.ts',
      closureId,
    ],
    async (err) => {
      if (err) {
        console.error('[WORKER] Erro no job', job.id, err.message)

        const attempts = job.attempts + 1

        await supabase
          .from('financial_jobs')
          .update({
            status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
            attempts,
            last_error: err.message,
          })
          .eq('id', job.id)

        return
      }

      await supabase
        .from('financial_jobs')
        .update({
          status: 'done',
          processed_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      console.log(`[WORKER] Job ${job.id} concluído`)
    }
  )
}

// ─────────────────────────────────────────────
// 🔁 Loop principal
// ─────────────────────────────────────────────
setInterval(() => {
  requeueStuckJobs()
    .then(processJob)
    .catch((err) =>
      console.error('[WORKER] Erro inesperado', err)
    )
}, POLL_INTERVAL_MS)
