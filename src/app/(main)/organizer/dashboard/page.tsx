'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface DashboardData {
  organizationName: string
  approved: boolean
  vipBoostCreditsAvailable: number
  eventsCount: number
  postsCount: number
  ticketsSoldCount: number
  totalRevenue: number
  totalLikes: number
  totalViews: number
  last30Views: number
  last30Sold: number
  last30Revenue: number
  upcomingEventsCount: number
  pastEventsCount: number
  recentEvents: Array<{ id: number; title: string; city: string; startTime: string; isApproved: boolean; likesCount: number; commentsCount: number }>
  eventTicketRows: Array<{ eventId: number; eventTitle: string; startTime: string; isApproved: boolean; sold: number; likes: number; views: number; vipBoostScore: number; revenue: number }>
}

export default function OrganizerDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    const roles = (session as any)?.user?.roles as string[] | undefined
    if (!roles?.includes('Organizer') && !roles?.includes('Admin')) {
      router.push('/')
      return
    }
    api.get<DashboardData>('/api/organizer/dashboard')
      .then(r => setData(r.data))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [status, session, router])

  if (loading || !data) {
    return (
      <section className="groove-app-page">
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      </section>
    )
  }

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Организатор</span>
          <h1 className="groove-panel-title">{data.organizationName}</h1>
          {!data.approved && (
            <div className="alert alert-warning mt-2">Акаунтът ти чака одобрение от администратор.</div>
          )}
        </div>
        <div className="groove-page-actions">
          <Link href="/organizer/events" className="groove-button groove-button-paper">
            <i className="bi bi-calendar-event" /> Моите събития
          </Link>
          <Link href="/events/new" className="groove-button groove-button-dark">
            <i className="bi bi-plus" /> Ново събитие
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="row g-3 mt-2">
        {[
          { label: 'Събития', value: data.eventsCount, icon: 'calendar-event' },
          { label: 'Предстоящи', value: data.upcomingEventsCount, icon: 'calendar-check' },
          { label: 'Продадени билети', value: data.ticketsSoldCount, icon: 'ticket-perforated' },
          { label: 'Приход', value: `${data.totalRevenue.toFixed(2)} лв`, icon: 'cash-stack' },
          { label: 'Харесвания', value: data.totalLikes, icon: 'heart' },
          { label: 'Прегледи (30д)', value: data.last30Views, icon: 'eye' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-4 col-lg-2">
            <div className="groove-paper-card text-center py-3">
              <i className={`bi bi-${s.icon} fs-4 text-primary d-block mb-1`} />
              <div className="fs-5 fw-bold">{s.value}</div>
              <div className="small text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Last 30 days */}
      <div className="groove-paper-card mt-4">
        <h2 className="groove-panel-title mb-3">Последните 30 дни</h2>
        <div className="row g-3">
          <div className="col-md-4 text-center">
            <div className="fs-4 fw-bold text-primary">{data.last30Sold}</div>
            <div className="text-muted small">Продадени билети</div>
          </div>
          <div className="col-md-4 text-center">
            <div className="fs-4 fw-bold text-success">{data.last30Revenue.toFixed(2)} лв</div>
            <div className="text-muted small">Приход</div>
          </div>
          <div className="col-md-4 text-center">
            <div className="fs-4 fw-bold text-info">{data.last30Views}</div>
            <div className="text-muted small">Прегледи</div>
          </div>
        </div>
      </div>

      {/* Recent events table */}
      <div className="groove-paper-card mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="groove-panel-title mb-0">Последни събития</h2>
          <Link href="/organizer/events" className="groove-button groove-button-paper groove-button--sm">Всички →</Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover groove-table">
            <thead>
              <tr>
                <th>Събитие</th>
                <th>Дата</th>
                <th>Одобрено</th>
                <th>Продадени</th>
                <th>Приход</th>
                <th>Прегледи</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.eventTicketRows.map(row => (
                <tr key={row.eventId}>
                  <td><strong>{row.eventTitle}</strong></td>
                  <td>{format(new Date(row.startTime), 'dd.MM.yyyy')}</td>
                  <td>
                    {row.isApproved
                      ? <span className="badge bg-success">Да</span>
                      : <span className="badge bg-warning text-dark">Чака</span>}
                  </td>
                  <td>{row.sold}</td>
                  <td>{row.revenue.toFixed(2)} лв</td>
                  <td>{row.views}</td>
                  <td>
                    <Link href={`/events/${row.eventId}`} className="groove-button groove-button-paper groove-button--sm">
                      Виж
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIP Boost */}
      <div className="groove-paper-card mt-4">
        <h2 className="groove-panel-title mb-2">VIP Boost</h2>
        <p className="text-muted">Налични кредити: <strong>{data.vipBoostCreditsAvailable}</strong></p>
        <p className="small text-muted">Използвай VIP boost, за да изведеш събитие на по-предна позиция в препоръките.</p>
      </div>
    </section>
  )
}
