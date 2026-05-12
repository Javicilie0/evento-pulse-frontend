import { Suspense } from 'react'
import { authenticatedServerApi } from '@/lib/serverApi'
import { EventCard } from '@/components/events/EventCard'
import { HomeFilters } from '@/components/home/HomeFilters'
import { HomeMap } from '@/components/home/HomeMap'
import type { EventCard as EventCardType, PaginatedResult } from '@/types/api'
import { mediaUrl } from '@/lib/media'
import Link from 'next/link'
import { format } from 'date-fns'

interface SearchParams {
  search?: string
  city?: string
  genre?: string
  dateFrom?: string
  dateTo?: string
  sort?: string
  page?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

async function getEvents(params: Record<string, string>) {
  try {
    const res = await (await authenticatedServerApi()).get<PaginatedResult<EventCardType>>('/api/events', { params })
    return res.data
  } catch {
    return { items: [], totalCount: 0, page: 1, pageSize: 12, hasMore: false }
  }
}

/* ─────────────────── Skeletons ─────────────────── */

function EventCardSkeleton() {
  return (
    <div className="card event-card evt-card" style={{ overflow: 'hidden' }}>
      <div className="evt-card__media" style={{ background: 'linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div className="evt-card__body" style={{ gap: 8 }}>
        <div style={{ height: 14, width: '55%', background: '#e5e7eb', borderRadius: 4, animation: 'shimmer 1.4s infinite' }} />
        <div style={{ height: 18, width: '80%', background: '#e5e7eb', borderRadius: 4, animation: 'shimmer 1.4s infinite 0.1s' }} />
        <div style={{ height: 12, width: '45%', background: '#e5e7eb', borderRadius: 4, animation: 'shimmer 1.4s infinite 0.2s' }} />
        <div style={{ height: 12, width: '35%', background: '#e5e7eb', borderRadius: 4, marginTop: 4, animation: 'shimmer 1.4s infinite 0.3s' }} />
      </div>
    </div>
  )
}

function EventsGridSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
      <div className="evt-discover">
        <div className="evt-grid">
          {Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
        <aside className="evt-trending">
          <div className="evt-trending__head" style={{ opacity: 0.4 }}>
            <div style={{ height: 22, width: 80, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 18, width: 140, background: '#e5e7eb', borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 12, width: 180, background: '#e5e7eb', borderRadius: 4 }} />
          </div>
        </aside>
      </div>
    </>
  )
}

function HeroStatsSkeleton() {
  return (
    <div className="evt-hero__stats" style={{ opacity: 0.5 }}>
      {[70, 40, 55].map((w, i) => (
        <span key={i} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <span style={{ display: 'inline-block', height: 22, width: w, background: '#d1d5db', borderRadius: 4 }} />
        </span>
      ))}
    </div>
  )
}

/* ─────────────────── Streaming server components ─────────────────── */

async function HeroStatsServer({ sp, page }: { sp: SearchParams; page: number }) {
  const data = await getEvents({
    page: String(page), pageSize: '12',
    ...(sp.search ? { keyword: sp.search } : {}),
    ...(sp.city ? { city: sp.city } : {}),
    ...(sp.genre ? { genre: sp.genre } : {}),
    ...(sp.dateFrom ? { dateFrom: sp.dateFrom } : {}),
    ...(sp.dateTo ? { dateTo: sp.dateTo } : {}),
    ...(sp.sort ? { sort: sp.sort } : {}),
  })
  const cityCount = new Set(data.items.map(e => e.city)).size
  const pinCount = data.items.filter(e => e.latitude != null && e.longitude != null).length
  return (
    <div className="evt-hero__stats">
      <span>
        <strong id="home-total-events-count">{data.totalCount}</strong>{' '}
        <span data-i18n="home.stats.nights">записани нощи</span>
      </span>
      <span>
        <strong id="home-city-count">{cityCount}</strong>{' '}
        <span data-i18n="home.stats.cities">града</span>
      </span>
      <span>
        <strong id="home-event-count">{pinCount}</strong>{' '}
        <span data-i18n="home.stats.pins">карфици</span>
      </span>
    </div>
  )
}

async function HomeMapServer({ sp, page }: { sp: SearchParams; page: number }) {
  const data = await getEvents({
    page: String(page), pageSize: '12',
    ...(sp.search ? { keyword: sp.search } : {}),
    ...(sp.city ? { city: sp.city } : {}),
    ...(sp.genre ? { genre: sp.genre } : {}),
    ...(sp.dateFrom ? { dateFrom: sp.dateFrom } : {}),
    ...(sp.dateTo ? { dateTo: sp.dateTo } : {}),
    ...(sp.sort ? { sort: sp.sort } : {}),
  })
  const mapMarkers = data.items
    .filter(e => e.latitude != null && e.longitude != null)
    .map(e => ({
      eventId: e.id, title: e.title, city: e.city, address: e.address,
      startTime: e.startTime, genre: e.genre, imageUrl: mediaUrl(e.imageUrl),
      organizerName: e.organizerName,
      lat: e.latitude as number, lng: e.longitude as number, isApproximate: false,
    }))
  return <HomeMap markers={mapMarkers} hasMarkers={mapMarkers.length > 0} />
}

async function EventsContentServer({ sp, page }: {
  sp: SearchParams; page: number
}) {
  const data = await getEvents({
    page: String(page), pageSize: '12',
    ...(sp.search ? { keyword: sp.search } : {}),
    ...(sp.city ? { city: sp.city } : {}),
    ...(sp.genre ? { genre: sp.genre } : {}),
    ...(sp.dateFrom ? { dateFrom: sp.dateFrom } : {}),
    ...(sp.dateTo ? { dateTo: sp.dateTo } : {}),
    ...(sp.sort ? { sort: sp.sort } : {}),
  })

  const visibleCount = Math.min(data.totalCount, page * 12)
  const buildHref = (overrides: Partial<SearchParams>) => {
    const params = new URLSearchParams()
    const merged = { ...sp, ...overrides }
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    const qs = params.toString()
    return `/${qs ? `?${qs}` : ''}`
  }
  const trendingEvents = [...data.items]
    .sort((a, b) =>
      (b.goingCount * 2 + b.interestedCount + b.likesCount + b.savesCount) -
      (a.goingCount * 2 + a.interestedCount + a.likesCount + a.savesCount)
    )
    .slice(0, 4)

  return (
    <div className="evt-discover">
      {data.items.length > 0 ? (
        <>
          <div id="event-cards-grid" className="evt-grid">
            {data.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {data.hasMore && (
            <div className="evt-load-more">
              <span className="evt-load-more__meta">
                <span data-i18n="common.showing">Показани</span>{' '}
                <strong>{visibleCount}</strong> / <strong>{data.totalCount}</strong>
              </span>
              <Link
                scroll={false}
                href={buildHref({ page: String(page + 1) })}
                className="evt-btn evt-btn-ghost"
              >
                <i className="bi bi-plus-circle" />
                <span data-i18n="common.show.more">Покажи още</span>
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="evt-empty">
          <p data-i18n="home.events.emptytext">
            Все още няма публикувани събития. Когато организаторите добавят такива, те ще се появят тук.
          </p>
        </div>
      )}

      {/* Trending sidebar */}
      <aside className="evt-trending">
        <div className="evt-trending__head">
          <span className="evt-card__chip evt-card__chip--hot" style={{ position: 'static', display: 'inline-block' }}>
            <i className="bi bi-graph-up-arrow" /> <span data-i18n="home.trending.stamp">Тренд</span>
          </span>
          <h3 data-i18n="home.trending.title">Хора следят сега</h3>
          <p data-i18n="home.trending.sub">Най-нашумелите събития според реакциите.</p>
        </div>
        <div className="evt-trending__list">
          {trendingEvents.length > 0 ? trendingEvents.map((ev, i) => (
            <Link key={ev.id} href={`/events/${ev.id}`} className="evt-trending__row">
              {ev.imageUrl ? (
                <img src={mediaUrl(ev.imageUrl)} alt={ev.title} loading="lazy" decoding="async" />
              ) : (
                <span className="evt-trending__placeholder"><i className="bi bi-calendar-event" /></span>
              )}
              <div className="evt-trending__body">
                <strong>{ev.title}</strong>
                <small>{ev.city} · {format(new Date(ev.startTime), 'dd.MM HH:mm')}</small>
              </div>
              <span className="evt-trending__rank">#{i + 1}</span>
            </Link>
          )) : (
            <p className="text-muted small mb-0" data-i18n="home.trending.empty">
              Все още няма достатъчно реакции.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}

/* ─────────────────── Page shell ─────────────────── */

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams
  const page = Number(sp.page ?? 1)

  // Date calculations — no API needed, renders instantly
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntilSat = ((6 - today.getDay()) + 7) % 7 || 7
  const nextSat = new Date(today); nextSat.setDate(today.getDate() + daysUntilSat)
  const nextSun = new Date(nextSat); nextSun.setDate(nextSat.getDate() + 1)
  const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + (7 - today.getDay()) % 7)

  const todayStr = format(today, 'yyyy-MM-dd')
  const nextSatStr = format(nextSat, 'yyyy-MM-dd')
  const nextSunStr = format(nextSun, 'yyyy-MM-dd')
  const endOfWeekStr = format(endOfWeek, 'yyyy-MM-dd')

  const isTabAll = !sp.search && !sp.dateFrom && !sp.dateTo && !sp.genre
  const isTabTonight = sp.dateFrom === todayStr && sp.dateTo === todayStr
  const isTabWeekend = sp.dateFrom === nextSatStr && sp.dateTo === nextSunStr
  const isTabWeek = sp.dateFrom === todayStr && sp.dateTo === endOfWeekStr
  const isTabFree = sp.search === 'free'

  return (
    <div className="evt-shell">

      {/* Marquee — instant */}
      <div className="evt-marquee" aria-hidden="true">
        <div className="evt-marquee__track">
          <span data-i18n="marquee.live">★ Живи нощи</span>
          <span data-i18n="marquee.diary">★ Дневник на града</span>
          <span data-i18n="marquee.map">★ Карта на България</span>
          <span data-i18n="marquee.tickets">★ Свежи билети</span>
          <span>★ Techno</span><span>★ House</span><span>★ Jazz</span>
          <span data-i18n="marquee.nearme">★ Около мен</span>
          <span data-i18n="marquee.live">★ Живи нощи</span>
          <span data-i18n="marquee.diary">★ Дневник на града</span>
          <span data-i18n="marquee.map">★ Карта на България</span>
          <span data-i18n="marquee.tickets">★ Свежи билети</span>
          <span>★ Techno</span><span>★ House</span><span>★ Jazz</span>
          <span data-i18n="marquee.nearme">★ Около мен</span>
        </div>
      </div>

      {/* Hero — text renders INSTANTLY, stats + map stream in */}
      <section className="evt-hero">
        <div className="evt-hero__copy">
          <h1 className="evt-hero__title" data-i18n-html="home.hero.h1">
            Открий <span>събития</span> наблизо.
          </h1>
          <p className="evt-hero__lead" data-i18n="home.hero.p">
            Концерти, театър, клубни вечери и фестивали в една компактна карта.
          </p>
          <div className="evt-hero__cta">
            <Link href="/events/recommended" className="evt-btn evt-btn-primary">
              <i className="bi bi-compass" />
              <span data-i18n="home.viewmap">Препоръчани</span>
            </Link>
            <Link href="/calendar" className="evt-btn evt-btn-ghost">
              <i className="bi bi-calendar3" />
              <span data-i18n="home.calendar">Календар</span>
            </Link>
            <Link href="/flow" className="evt-btn evt-btn-ghost">
              <i className="bi bi-grid" />
              <span data-i18n="home.openfeed">Поток</span>
            </Link>
          </div>
          {/* Stats stream in — show skeleton while API fetches */}
          <Suspense fallback={<HeroStatsSkeleton />}>
            <HeroStatsServer sp={sp} page={page} />
          </Suspense>
        </div>

        {/* Map streams in */}
        <Suspense fallback={
          <div style={{ flex: 1, minHeight: 280, background: 'linear-gradient(135deg,#e5e7eb,#f3f4f6)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} />
          </div>
        }>
          <HomeMapServer sp={sp} page={page} />
        </Suspense>
      </section>

      {/* Map event preview panel */}
      <div id="map-event-preview" className="evt-map-preview" aria-live="polite" style={{ display: 'none' }}>
        <div className="evt-map-preview__inner">
          <img id="map-preview-img" alt="" className="evt-map-preview__img" style={{ display: 'none' }} />
          <div className="evt-map-preview__body">
            <div className="evt-map-preview__meta">
              <span id="map-preview-genre" className="evt-card__chip" style={{ position: 'static', display: 'inline-flex' }} />
            </div>
            <h3 id="map-preview-title" className="evt-map-preview__title" />
            <p id="map-preview-address" className="evt-map-preview__address" />
            <p id="map-preview-time" className="evt-map-preview__time" />
          </div>
          <a id="map-preview-link" href="#" className="evt-btn evt-btn-primary evt-map-preview__btn">
            <i className="bi bi-arrow-right-circle" />
            <span>Виж събитието</span>
          </a>
        </div>
        <button id="map-preview-close" className="evt-map-preview__close" type="button" aria-label="Затвори">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* Filter tabs + AI search — renders INSTANTLY (no API) */}
      <div id="home-filter-anchor" className="evt-search-section" data-filter-anchor data-filter-button-label="Филтри">
        <div id="home-filter-tabs" className="evt-search-tabs-bar">
          <Link scroll={false} className={`evt-search-tab-link ${isTabAll ? 'is-active' : ''}`} href="/">
            <i className="bi bi-grid-3x3-gap" /> <span data-i18n="search.tab.all">Всички</span>
          </Link>
          <Link scroll={false} className={`evt-search-tab-link ${isTabTonight ? 'is-active' : ''}`} href={`/?dateFrom=${todayStr}&dateTo=${todayStr}`}>
            <i className="bi bi-calendar-day" /> <span data-i18n="search.tab.tonight">Днес</span>
          </Link>
          <Link scroll={false} className={`evt-search-tab-link ${isTabWeekend ? 'is-active' : ''}`} href={`/?dateFrom=${nextSatStr}&dateTo=${nextSunStr}`}>
            <i className="bi bi-stars" /> <span data-i18n="search.tab.weekend">Уикенд</span>
          </Link>
          <Link scroll={false} className={`evt-search-tab-link ${isTabWeek ? 'is-active' : ''}`} href={`/?dateFrom=${todayStr}&dateTo=${endOfWeekStr}`}>
            <i className="bi bi-calendar-week" /> <span data-i18n="search.tab.week">Тази седмица</span>
          </Link>
          <Link scroll={false} className={`evt-search-tab-link ${isTabFree ? 'is-active' : ''}`} href="/?search=free">
            <i className="bi bi-ticket-perforated" /> <span data-i18n="chip.free">Безплатни</span>
          </Link>
        </div>
        <HomeFilters />
      </div>

      {/* Events section — streams in with skeleton */}
      <section id="home-events-surface" className="evt-section" aria-live="polite">
        <div className="evt-section__head">
          <div>
            <h2 className="evt-section__title" data-i18n="home.events.discover">Открий своята вечер</h2>
            <p className="evt-section__sub" data-i18n="home.events.discover.sub">
              Подбрани събития, фестивали и партита около теб.
            </p>
          </div>
          <form id="home-events-filter" method="get" className="evt-toolbar" style={{ gap: 8 }}>
            {sp.search && <input type="hidden" name="search" value={sp.search} />}
            {sp.city && <input type="hidden" name="city" value={sp.city} />}
            {sp.genre && <input type="hidden" name="genre" value={sp.genre} />}
            {sp.dateFrom && <input type="hidden" name="dateFrom" value={sp.dateFrom} />}
            {sp.dateTo && <input type="hidden" name="dateTo" value={sp.dateTo} />}
            <div className="evt-sort">
              <i className="bi bi-arrow-down-up" />
              <select name="sort" defaultValue={sp.sort ?? 'recent'}>
                <option value="recent" data-i18n="sort.recent">Recently added</option>
                <option value="soon" data-i18n="sort.soon">Starting soon</option>
                <option value="popular" data-i18n="sort.popular">Most popular</option>
              </select>
            </div>
            <button type="submit" className="evt-btn evt-btn-ghost" style={{ padding: '8px 16px' }}>
              <i className="bi bi-funnel" /> <span data-i18n="home.filter.btn">Филтрирай</span>
            </button>
          </form>
        </div>

        {/* Genre chips — instant, no API */}
        <div className="evt-toolbar">
          <div className="evt-chips">
            <Link scroll={false} className={`evt-chip ${isTabAll ? 'is-active' : ''}`} href="/" data-i18n="search.tab.all">Всички</Link>
            <Link scroll={false} className={`evt-chip ${sp.genre === 'LiveMusic' ? 'is-active' : ''}`} href="/?genre=LiveMusic" data-i18n="genre.LiveMusic">Live музика</Link>
            <Link scroll={false} className={`evt-chip ${sp.genre === 'Festival' ? 'is-active' : ''}`} href="/?genre=Festival" data-i18n="genre.Festival">Фестивал</Link>
            <Link scroll={false} className={`evt-chip ${sp.genre === 'Theater' ? 'is-active' : ''}`} href="/?genre=Theater" data-i18n="genre.Theater">Театър</Link>
            <Link scroll={false} className={`evt-chip ${isTabFree ? 'is-active' : ''}`} href="/?search=free" data-i18n="chip.free">Безплатни</Link>
            <Link scroll={false} className={`evt-chip ${sp.genre === 'Kids' ? 'is-active' : ''}`} href="/?genre=Kids" data-i18n="genre.Kids">За деца</Link>
            <Link scroll={false} className={`evt-chip ${sp.genre === 'Techno' ? 'is-active' : ''}`} href="/?genre=Techno" data-i18n="genre.Techno">Techno</Link>
            <Link scroll={false} className={`evt-chip ${sp.genre === 'House' ? 'is-active' : ''}`} href="/?genre=House" data-i18n="genre.House">House</Link>
            <Link scroll={false} className={`evt-chip ${sp.genre === 'Jazz' ? 'is-active' : ''}`} href="/?genre=Jazz" data-i18n="genre.Jazz">Jazz</Link>
          </div>
          <Link href="/events/new" className="evt-btn evt-btn-primary" style={{ padding: '8px 16px' }}>
            <i className="bi bi-plus-lg" /> <span data-i18n="home.events.create">Създай събитие</span>
          </Link>
        </div>

        {/* Events grid — streams in */}
        <Suspense fallback={<EventsGridSkeleton />}>
          <EventsContentServer sp={sp} page={page} />
        </Suspense>
      </section>
    </div>
  )
}
