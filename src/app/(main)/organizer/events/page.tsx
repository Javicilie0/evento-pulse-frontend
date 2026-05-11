import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

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

export default async function OrganizerEventsPage() {
  let events: OrganizerEvent[] = []
  let error: string | null = null
  try {
    const res = await (await authenticatedServerApi()).get<OrganizerEvent[]>('/api/organizer/events')
    events = res.data
  } catch {
    error = 'Събитията на организатора не можаха да се заредят.'
  }

  if (error) {
    return (
      <section className="groove-app-page">
        <div className="groove-empty-card">
          <i className="bi bi-calendar-x" />
          <h1 className="groove-panel-title">Моите събития</h1>
          <p className="groove-panel-intro">{error}</p>
          <a href="/organizer/dashboard" className="groove-button groove-button-paper mt-3">Назад към таблото</a>
        </div>
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
                    <td>{ev.vipBoostScore > 0
                      ? <span className="badge bg-warning text-dark"><i className="bi bi-star-fill" /> {ev.vipBoostScore}</span>
                      : '—'}
                    </td>
                    <td>
                      <Link href={`/events/${ev.id}`} className="groove-button groove-button-paper groove-button--sm">Виж</Link>
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
