import { EventCard } from '@/components/events/EventCard'
import { serverApi } from '@/lib/api'
import Link from 'next/link'
import { format } from 'date-fns'
import type { EventCard as EventCardType, PaginatedResult } from '@/types/api'

const GENRES = [
  { value: 'LiveMusic', label: 'Live музика', i18n: 'genre.LiveMusic' },
  { value: 'Festival', label: 'Фестивал', i18n: 'genre.Festival' },
  { value: 'Theater', label: 'Театър', i18n: 'genre.Theater' },
  { value: 'Kids', label: 'За деца', i18n: 'genre.Kids' },
  { value: 'Techno', label: 'Techno', i18n: 'genre.Techno' },
  { value: 'House', label: 'House', i18n: 'genre.House' },
  { value: 'Jazz', label: 'Jazz', i18n: 'genre.Jazz' },
  { value: 'Sports', label: 'Спорт', i18n: 'genre.Sports' },
  { value: 'Art', label: 'Изкуство', i18n: 'genre.Art' },
  { value: 'Other', label: 'Друго', i18n: 'genre.Other' },
]

interface Props {
  searchParams: Promise<{
    page?: string
    keyword?: string
    city?: string
    genre?: string
    dateFrom?: string
    dateTo?: string
    sort?: string
  }>
}

async function getEvents(params: Record<string, string>) {
  try {
    const res = await serverApi().get<PaginatedResult<EventCardType>>('/api/events', { params })
    return res.data
  } catch {
    return { items: [], totalCount: 0, page: 1, pageSize: 12, hasMore: false }
  }
}

export default async function EventsPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = Number(sp.page ?? 1)

  const data = await getEvents({
    page: String(page),
    pageSize: '12',
    ...(sp.keyword ? { keyword: sp.keyword } : {}),
    ...(sp.city ? { city: sp.city } : {}),
    ...(sp.genre ? { genre: sp.genre } : {}),
    ...(sp.dateFrom ? { dateFrom: sp.dateFrom } : {}),
    ...(sp.dateTo ? { dateTo: sp.dateTo } : {}),
    ...(sp.sort ? { sort: sp.sort } : {}),
  })

  const visibleCount = Math.min(data.totalCount, page * 12)
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const merged = { keyword: sp.keyword, city: sp.city, genre: sp.genre, dateFrom: sp.dateFrom, dateTo: sp.dateTo, sort: sp.sort, ...overrides }
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
    return `/events${qs ? `?${qs}` : ''}`
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Каталог</span>
          <h1 className="groove-panel-title" data-i18n="events.title">Всички събития</h1>
        </div>
        <Link href="/events/new" className="groove-button groove-button-dark">
          <i className="bi bi-plus-lg" /> <span data-i18n="home.events.create">Създай събитие</span>
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" action="/events" className="groove-filters mb-4">
        <div className="groove-filters__row">
          <div className="input-group input-group-sm">
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input
              name="keyword"
              defaultValue={sp.keyword}
              placeholder="Търси събитие..."
              data-i18n-placeholder="events.search.placeholder"
              className="form-control"
            />
          </div>
          <div className="input-group input-group-sm">
            <span className="input-group-text"><i className="bi bi-geo-alt" /></span>
            <input
              name="city"
              defaultValue={sp.city}
              placeholder="Град..."
              data-i18n-placeholder="events.city.placeholder"
              className="form-control"
            />
          </div>
          <select name="genre" defaultValue={sp.genre ?? ''} className="form-select form-select-sm">
            <option value="" data-i18n="search.tab.all">Всички жанрове</option>
            {GENRES.map(g => (
              <option key={g.value} value={g.value} data-i18n={g.i18n}>{g.label}</option>
            ))}
          </select>
          <input name="dateFrom" type="date" defaultValue={sp.dateFrom} className="form-control form-control-sm" />
          <input name="dateTo" type="date" defaultValue={sp.dateTo} className="form-control form-control-sm" />
          <select name="sort" defaultValue={sp.sort ?? 'recent'} className="form-select form-select-sm">
            <option value="recent" data-i18n="sort.recent">Нови</option>
            <option value="soon" data-i18n="sort.soon">Скоро</option>
            <option value="popular" data-i18n="sort.popular">Популярни</option>
          </select>
          <button type="submit" className="groove-button groove-button-dark">
            <i className="bi bi-funnel" /> <span data-i18n="home.filter.btn">Филтрирай</span>
          </button>
          {(sp.keyword || sp.city || sp.genre || sp.dateFrom || sp.dateTo) && (
            <Link href="/events" className="groove-button groove-button-paper">
              <i className="bi bi-x" /> <span data-i18n="home.clear">Изчисти</span>
            </Link>
          )}
        </div>
      </form>

      {/* Genre chips */}
      <div className="evt-chips mb-4">
        <Link className={`evt-chip ${!sp.genre ? 'is-active' : ''}`} href="/events" data-i18n="search.tab.all">Всички</Link>
        {GENRES.map(g => (
          <Link
            key={g.value}
            className={`evt-chip ${sp.genre === g.value ? 'is-active' : ''}`}
            href={buildHref({ genre: g.value, page: undefined })}
            data-i18n={g.i18n}
          >
            {g.label}
          </Link>
        ))}
      </div>

      <div className="mb-3 text-muted small">
        <span data-i18n="common.showing">Показани</span>{' '}
        <strong>{visibleCount}</strong> / <strong>{data.totalCount}</strong>
      </div>

      {data.items.length === 0 ? (
        <div className="groove-empty-card">
          <i className="bi bi-search" />
          <h2 className="groove-panel-title" data-i18n="home.events.emptytext">Няма намерени събития.</h2>
          <Link href="/events" className="groove-button groove-button-paper mt-3">
            <i className="bi bi-x" /> Изчисти филтрите
          </Link>
        </div>
      ) : (
        <>
          <div className="evt-grid">
            {data.items.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {(page > 1 || data.hasMore) && (
            <div className="evt-load-more mt-4">
              <span className="evt-load-more__meta">
                <span data-i18n="common.showing">Показани</span>{' '}
                <strong>{visibleCount}</strong> / <strong>{data.totalCount}</strong>
              </span>
              <div className="d-flex gap-2">
                {page > 1 && (
                  <Link href={buildHref({ page: String(page - 1) })} className="groove-button groove-button-paper">
                    <i className="bi bi-arrow-left" /> <span>Предишна</span>
                  </Link>
                )}
                {data.hasMore && (
                  <Link href={buildHref({ page: String(page + 1) })} className="groove-button groove-button-dark">
                    <i className="bi bi-plus-circle" /> <span data-i18n="common.show.more">Покажи още</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
