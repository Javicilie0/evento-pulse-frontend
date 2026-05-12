import { authenticatedServerApi } from '@/lib/serverApi'
import type { Post } from '@/types/api'
import { PostCard } from '@/components/posts/PostCard'

interface AdminStats {
  usersCount: number
  organizersCount: number
  eventsCount: number
  pendingOrganizersCount: number
  pendingEventsCount: number
  postsCount: number
  totalRevenue: number
  recentPosts?: Post[]
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
          <h1>Админ <span>център</span>.</h1>
          <p>Оттук управляваш роли, кандидатури, събития, публикации, билети и транзакции в Evento.</p>
        </div>
        <div className="groove-page-actions">
          <a href="/account" className="groove-button groove-button-paper">
            <i className="bi bi-person-circle" /> Моят профил
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/tickets/validate" className="groove-button groove-button-dark">
            <i className="bi bi-qr-code-scan" /> Валидиране
          </a>
        </div>
      </div>

      <div className="row g-3 mt-2">
        {tiles.map(s => (
          <div key={s.label} className="col-6 col-md-4 col-lg-3">
            <a href={s.href} className="groove-paper-card text-center py-4 text-decoration-none d-block groove-stat-card">
              <i className={`bi bi-${s.icon} fs-3 ${s.badge ? 'text-danger' : 'text-primary'} d-block mb-2`} />
              <div className={`fs-4 fw-bold ${s.badge ? 'text-danger' : ''}`}>{s.value}</div>
              <div className="small text-muted">{s.label}</div>
            </a>
          </div>
        ))}
      </div>

      <section className="groove-page-section">
        <div className="groove-section-bar">
          <div>
            <span className="groove-kicker">Бързи действия</span>
            <h2>Всички <span>админ панели</span>.</h2>
          </div>
        </div>

        <div className="groove-mini-grid">
          {[
            { kicker: 'Роли', title: 'Потребители', text: 'Смяна на роли и редакция на акаунти.', href: '/admin/users' },
            { kicker: 'Кандидатури', title: 'Организатори', text: 'Преглед и одобряване на нови организатори.', href: '/admin/organizers' },
            { kicker: 'Съдържание', title: 'Събития', text: 'Одобряване и управление на публикуваните събития.', href: '/admin/events' },
            { kicker: 'Съдържание', title: 'Публикации', text: 'Преглед на постовете и тяхната активност.', href: '/admin/posts' },
            { kicker: 'Продажби', title: 'Билети', text: 'Следене на продадени, използвани и активни билети.', href: '/admin/tickets' },
            { kicker: 'Финанси', title: 'Транзакции', text: 'Списък с плащания и обобщение на приходите.', href: '/admin/transactions' },
          ].map(action => (
            <a key={action.href} href={action.href} className="groove-paper-card admin-action-card">
              <span className="groove-kicker">{action.kicker}</span>
              <h3 className="mt-2">{action.title}</h3>
              <p>{action.text}</p>
              <span className="admin-action-card__cta">Отвори</span>
            </a>
          ))}
        </div>
      </section>

      {!!stats.recentPosts?.length && (
        <section className="groove-page-section">
          <div className="groove-section-bar">
            <div>
              <span className="groove-kicker">Активност</span>
              <h2>Последни <span>публикации</span>.</h2>
            </div>
          </div>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
            {stats.recentPosts.map(post => <div key={post.id} className="col"><PostCard post={post} /></div>)}
          </div>
        </section>
      )}
    </section>
  )
}
