import Link from 'next/link'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: '#111',
          color: '#fff',
          padding: 20
        }}
      >
        <h2>DOOHPLAY</h2>

        <nav style={{ marginTop: 30 }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <Link href="/dashboard">📊 Dashboard</Link>
            </li>
            <li>
              <Link href="/dashboard/closures">📁 Fechamentos</Link>
            </li>
            <li>
              <Link href="/dashboard/audit">🕵️ Auditoria</Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 30 }}>{children}</main>
    </div>
  )
}
