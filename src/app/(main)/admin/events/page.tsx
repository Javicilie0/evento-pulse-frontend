'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { Suspense } from 'react'

interface AdminEvent {
  id: number
  title: string
  city: string
  startTime: string
  isApproved: boolean
  hasPendingChanges: boolean
  organizerName: string
  genre: string
  imageUrl?: string
  likesCount: number
  createdAt: string
}

function AdminEventsInner() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pendingOnly = searchParams.get('pending') === 'true'

  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    const roles = (session as any)?.user?.roles as string[] | undefined
    if (!roles?.includes('Admin')) { router.push('/'); return }
    const url = pendingOnly ? '/api/admin/events?pending=true' : '/api/admin/events'
    api.get<AdminEvent[]>(url).then(r => setEvents(r.data)).finally(() => setLoading(false))
  }, [status, session, router, pendingOnly])

  async function toggleApprove(id: number) {
    setActionId(id)
    try {
      const res = await api.post<{ isApproved: boolean }>(`/api/admin/events/${id}/approve`)
      setEvents(prev => prev.map(e => e.id === id ? { ...e, isApproved: res.data.isApproved } : e))
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
  }

  return (
    <>
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Администратор</span>
          <h1 className="groove-panel-title">{pendingOnly ? 'Чакащи одобрение' : 'Всички събития'}</h1>
        </div>
        <div className="groove-page-actions">
          <Link href="/admin/events" className={`groove-button ${!pendingOnly ? 'groove-button-dark' : 'groove-button-paper'}`}>Всички</Link>
          <Link href="/admin/events?pending=true" className={`groove-button ${pendingOnly ? 'groove-button-dark' : 'groove-button-paper'}`}>Чакащи</Link>
          <Link href="/admin/event-changes" className="groove-button groove-button-paper">Промени</Link>
          <Link href="/admin" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Табло</Link>
        </div>
      </div>

      <div className="groove-paper-card">
        <div className="table-responsive">
          <table className="table table-hover groove-table">
            <thead>
              <tr>
                <th>Събитие</th>
                <th>Организатор</th>
                <th>Град</th>
                <th>Дата</th>
                <th>Жанр</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td><strong>{ev.title}</strong></td>
                  <td>{ev.organizerName}</td>
                  <td>{ev.city}</td>
                  <td>{format(new Date(ev.startTime), 'dd.MM.yyyy')}</td>
                  <td><span className="badge bg-secondary">{ev.genre}</span></td>
                  <td>
                    {ev.isApproved
                      ? <span className="badge bg-success">Одобрено</span>
                      : ev.hasPendingChanges
                        ? <span className="badge bg-warning text-dark">Промени</span>
                        : <span className="badge bg-secondary">Чака</span>}
                  </td>
                  <td className="d-flex gap-1">
                    <Link href={`/events/${ev.id}`} className="groove-button groove-button-paper groove-button--sm">Виж</Link>
                    <button
                      className={`groove-button groove-button--sm ${ev.isApproved ? 'groove-button-paper' : 'groove-button-dark'}`}
                      onClick={() => toggleApprove(ev.id)}
                      disabled={actionId === ev.id}
                    >
                      {actionId === ev.id
                        ? <span className="spinner-border spinner-border-sm" />
                        : ev.isApproved ? 'Отнеми' : 'Одобри'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default function AdminEventsPage() {
  return (
    <section className="groove-app-page">
      <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" /></div>}>
        <AdminEventsInner />
      </Suspense>
    </section>
  )
}
