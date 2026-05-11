import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'
import { mediaUrl } from '@/lib/media'

interface WrappedEvent {
  id: number
  title: string
  city: string
  startTime: string
  imageUrl?: string
  genre: string
}

interface Wrapped {
  year: number
  displayName: string
  totalEventsAttended: number
  totalHoursOnScene: number
  citiesVisited: number
  organizersFollowed: number
  likesGiven: number
  commentsPosted: number
  topGenre?: string
  topGenreCount: number
  topCity?: string
  topCityCount: number
  topOrganizer?: string
  topOrganizerCount: number
  busiestMonth?: number
  busiestMonthCount: number
  topEvents: WrappedEvent[]
}

async function getWrapped() {
  try {
    const res = await (await authenticatedServerApi()).get<Wrapped>('/api/wrapped')
    return res.data
  } catch {
    return null
  }
}

export default async function WrappedPage() {
  const wrapped = await getWrapped()

  if (!wrapped) {
    return (
      <section className="groove-app-page">
        <div className="groove-empty-card">
          <i className="bi bi-stars" />
          <h1 className="groove-panel-title">Wrapped не може да се зареди</h1>
        </div>
      </section>
    )
  }

  const stats = [
    ['Събития', wrapped.totalEventsAttended],
    ['Часа навън', wrapped.totalHoursOnScene],
    ['Града', wrapped.citiesVisited],
    ['Харесвания', wrapped.likesGiven],
    ['Коментари', wrapped.commentsPosted],
    ['Последвани', wrapped.organizersFollowed],
  ]

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp">Wrapped {wrapped.year}</span>
          <h1>{wrapped.displayName}, твоят <span>Evento recap</span>.</h1>
          <p className="groove-page-hero__lead">Любими жанрове, градове и вечери от годината.</p>
        </div>
      </div>

      <div className="row g-3 mt-4">
        {stats.map(([label, value]) => (
          <div key={label} className="col-6 col-lg-2">
            <div className="groove-paper-card text-center h-100">
              <div className="display-6 fw-bold">{value}</div>
              <div className="small text-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mt-2">
        <div className="col-md-4">
          <div className="groove-info-card h-100"><span className="groove-kicker">Жанр</span><h2>{wrapped.topGenre ?? '-'}</h2><p>{wrapped.topGenreCount} събития</p></div>
        </div>
        <div className="col-md-4">
          <div className="groove-info-card h-100"><span className="groove-kicker">Град</span><h2>{wrapped.topCity ?? '-'}</h2><p>{wrapped.topCityCount} събития</p></div>
        </div>
        <div className="col-md-4">
          <div className="groove-info-card h-100"><span className="groove-kicker">Организатор</span><h2>{wrapped.topOrganizer ?? '-'}</h2><p>{wrapped.topOrganizerCount} събития</p></div>
        </div>
      </div>

      {wrapped.topEvents.length > 0 && (
        <section className="groove-page-section">
          <div className="groove-section-bar">
            <div>
              <span className="groove-kicker">Топ вечери</span>
              <h2>Събитията, които маркира годината.</h2>
            </div>
          </div>
          <div className="evt-similar__grid">
            {wrapped.topEvents.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} className="evt-trending__row">
                {event.imageUrl ? <img src={mediaUrl(event.imageUrl)} alt={event.title} /> : <span className="evt-trending__placeholder"><i className="bi bi-calendar-event" /></span>}
                <div className="evt-trending__body">
                  <strong>{event.title}</strong>
                  <small>{event.city} · {format(new Date(event.startTime), 'dd.MM.yyyy')}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
