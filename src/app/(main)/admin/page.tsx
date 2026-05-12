import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'

interface AdminStats {
  usersCount: number
  organizersCount: number
  eventsCount: number
  pendingOrganizersCount: number
  pendingEventsCount: number
  postsCount: number
  totalRevenue: number
}

export default async function AdminDashboardPage() {
  const sapi = await authenticatedServerApi()
  let stats: AdminStats = { usersCount: 0, organizersCount: 0, eventsCount: 0, pendingOrganizersCount: 0, pendingEventsCount: 0, postsCount: 0, totalRevenue: 0 }
  try {
    const res = await sapi.get<AdminStats>('/api/admin/dashboard')
    stats = res.data
  } catch {}

  const tiles = [
    { label: 'Потребители', value: stats.usersCount, icon: 'people', href: '/admin/users' },
    { label: 'Организатори', value: stats.organizersCount, icon: 'building', href: '/admin/organizers' },
    { label: 'Събития', value: stats.eventsCount, icon: 'calendar-event', href: '/admin/events' },
    { label: 'Чакащи орг.', value: stats.pendingOrganizersCount, icon: 'person-exclamation', href: '/admin/organizers', badge: stats.pendingOrganizersCount > 0 },
    { label: 'Чакащи събит.', value: stats.pendingEventsCount, icon: 'calendar-x', href: '/admin/events?pending=true', badge: stats.pendingEventsCount > 0 },
    { label: 'Публикации', value: stats.postsCount, icon: 'file-post', href: '/admin/posts' },
    { label: 'Приход', value: `${stats.totalRevenue.toFixed(2)} лв`, icon: 'cash-stack', href: '/admin/transactions' },
  ]

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-red">Администратор</span>
          <h1 className="groove-panel-title">Административен панел</h1>
        </div>
      </div>

      <div className="row g-3 mt-2">
        {tiles.map(s => (
          <div key={s.label} className="col-6 col-md-4 col-lg-3">
            <Link href={s.href} className="groove-paper-card text-center py-4 text-decoration-none d-block groove-stat-card">
              <i className={`bi bi-${s.icon} fs-3 ${s.badge ? 'text-danger' : 'text-primary'} d-block mb-2`} />
              <div className={`fs-4 fw-bold ${s.badge ? 'text-danger' : ''}`}>{s.value}</div>
              <div className="small text-muted">{s.label}</div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-4 mt-2">
        <div className="col-md-6">
          <div className="groove-paper-card">
            <h2 className="groove-panel-title mb-3">Бързи действия</h2>
            <div className="d-flex flex-column gap-2">
              <Link href="/admin/organizers" className="groove-button groove-button-paper">
                <i className="bi bi-person-check" /> Одобряване на организатори
                {stats.pendingOrganizersCount > 0 && <span className="badge bg-danger ms-2">{stats.pendingOrganizersCount}</span>}
              </Link>
              <Link href="/admin/events?pending=true" className="groove-button groove-button-paper">
                <i className="bi bi-calendar-check" /> Одобряване на събития
                {stats.pendingEventsCount > 0 && <span className="badge bg-danger ms-2">{stats.pendingEventsCount}</span>}
              </Link>
              <Link href="/admin/users" className="groove-button groove-button-paper">
                <i className="bi bi-people" /> Управление на потребители
              </Link>
              <Link href="/admin/events" className="groove-button groove-button-paper">
                <i className="bi bi-calendar-event" /> Всички събития
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
