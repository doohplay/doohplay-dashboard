import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ALLOWED_ROLES = ['admin', 'finance']

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient()

  // 🔐 Sessão
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // 🔐 Role blindada
  const role =
    (session.user.app_metadata &&
      typeof session.user.app_metadata === 'object' &&
      'role' in session.user.app_metadata &&
      session.user.app_metadata.role) ||
    null

  if (!role || !ALLOWED_ROLES.includes(role)) {
    redirect('/unauthorized')
  }

  // 📊 KPIs
  const [
    closuresRes,
    pdfsRes,
    downloadsRes,
    jobsErrorRes,
  ] = await Promise.all([
    supabase.from('monthly_closures').select('*', {
      count: 'exact',
      head: true,
    }),
    supabase
      .from('monthly_closures')
      .select('*', { count: 'exact', head: true })
      .not('pdf_generated_at', 'is', null),
    supabase
      .from('document_downloads')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('financial_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error'),
  ])

  if (
    closuresRes.error ||
    pdfsRes.error ||
    downloadsRes.error ||
    jobsErrorRes.error
  ) {
    console.error('[DASHBOARD] Erro ao carregar KPIs', {
      closuresRes,
      pdfsRes,
      downloadsRes,
      jobsErrorRes,
    })
  }

  const totalClosures = closuresRes.count ?? 0
  const pdfs = pdfsRes.count ?? 0
  const downloads = downloadsRes.count ?? 0
  const jobsError = jobsErrorRes.count ?? 0

  // 📄 Últimos fechamentos
  const { data: closures = [] } = await supabase
    .from('monthly_closures')
    .select(
      'id, report_code, year, month, status, pdf_generated_at, finalized_at'
    )
    .order('finalized_at', { ascending: false })
    .limit(10)

  // ⚙️ Jobs recentes
  const { data: jobs = [] } = await supabase
    .from('financial_jobs')
    .select('id, type, status, attempts, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 Dashboard Financeiro</h1>

      <p>
        Usuário autorizado como: <strong>{role}</strong>
      </p>

      {/* ===== KPIs ===== */}
      <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
        <Kpi label="Fechamentos" value={totalClosures} />
        <Kpi label="PDFs gerados" value={pdfs} />
        <Kpi label="Downloads" value={downloads} />
        <Kpi label="Jobs com erro" value={jobsError} />
      </div>

      {/* ===== FECHAMENTOS ===== */}
      <h2 style={{ marginTop: 40 }}>Últimos fechamentos</h2>
      <table border={1} cellPadding={8} width="100%">
        <thead>
          <tr>
            <th>Código</th>
            <th>Período</th>
            <th>Status</th>
            <th>PDF</th>
          </tr>
        </thead>
        <tbody>
          {closures.map(c => (
            <tr key={c.id}>
              <td>{c.report_code}</td>
              <td>
                {String(c.month).padStart(2, '0')}/{c.year}
              </td>
              <td>{c.status}</td>
              <td>{c.pdf_generated_at ? '✅' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== JOBS ===== */}
      <h2 style={{ marginTop: 40 }}>⚙️ Jobs recentes</h2>
      <table border={1} cellPadding={8} width="100%">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Status</th>
            <th>Tentativas</th>
            <th>Criado em</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id}>
              <td>{job.type}</td>
              <td>{job.status}</td>
              <td>{job.attempts}</td>
              <td>{new Date(job.created_at).toLocaleString('pt-BR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ===== COMPONENTE KPI ===== */
function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: 16,
        borderRadius: 8,
        minWidth: 160,
      }}
    >
      <strong>{label}</strong>
      <div style={{ fontSize: 24 }}>{value}</div>
    </div>
  )
}
