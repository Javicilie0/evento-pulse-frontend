'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface OrganizerEvent {
  id: number
  title: string
  city: string
  startTime: string
  isApproved: boolean
  hasPendingChanges: boolean
  organizerPageName: string
  ticketsCount: number
  soldTicketsCount: number
  vipBoostScore: number
  likesCount: number
  commentsCount: number
  imageUrl?: string
}

export default function OrganizerEventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    const roles = (session as any)?.user?.roles as string[] | undefined
    if (!roles?.includes('Organizer') && !roles?.includes('Admin')) {
      router.push('/')
      return
    }
    api.get<OrganizerEvent[]>('/api/organizer/events')
      .then(r => setEvents(r.data))
      .finally(() => setLoading(false))
  }, [status, session, router])

  if (loading) {
    return (
      <section className="groove-app-page">
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      </section>
    )
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Организатор</span>
          <h1 className="groove-panel-title">Моите събития</h1>
        </div>
        <div className="groove-page-actions">
          <Link href="/organizer/dashboard" className="groove-button groove-button-paper">
            <i className="bi bi-grid" /> Табло
          </Link>
          <Link href="/events/new" className="groove-button groove-button-dark">
            <i className="bi bi-plus" /> Ново събитие
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="groove-empty-card">
          <i className="bi bi-calendar-x" />
          <h2 className="groove-panel-title">Нямаш публикувани събития</h2>
          <Link href="/events/new" className="groove-button groove-button-dark mt-3">
            <i className="bi bi-plus" /> Създай първото си събитие
          </Link>
        </div>
      ) : (
        <div className="groove-paper-card">
          <div className="table-responsive">
            <table className="table table-hover groove-table">
              <thead>
                <tr>
                  <th>Събитие</th>
                  <th>Град</th>
                  <th>Дата</th>
                  <th>Статус</th>
                  <th>Билети</th>
                  <th>Харесвания</th>
                  <th>VIP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id}>
                    <td>
                      <strong>{ev.title}</strong>
                      <div className="small text-muted">{ev.organizerPageName}</div>
                    </td>
                    <td>{ev.city}</td>
                    <td>{format(new Date(ev.startTime), 'dd.MM.yyyy HH:mm')}</td>
                    <td>
                      {ev.isApproved
                        ? <span className="badge bg-success">Одобрено</span>
                        : ev.hasPendingChanges
                          ? <span className="badge bg-warning text-dark">Промени</span>
                          : <span className="badge bg-secondary">Чака</span>}
                    </td>
                    <td>
                      <span className="text-success fw-bold">{ev.soldTicketsCount}</span>
                      <span className="text-muted">/{ev.ticketsCount}</span>
                    </td>
                    <td>{ev.likesCount}</td>
                    <td>{ev.vipBoostScore > 0 ? <span className="badge bg-warning text-dark"><i className="bi bi-star-fill" /> {ev.vipBoostScore}</span> : '—'}</td>
                    <td>
                      <Link href={`/events/${ev.id}`} className="groove-button groove-button-paper groove-button--sm">
                        Виж
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
