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

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams
  const page = Number(sp.page ?? 1)

  const data = await getEvents({
    page: String(page),
    pageSize: '12',
    ...(sp.search && sp.search !== 'free' ? { keyword: sp.search } : {}),
    ...(sp.city ? { city: sp.city } : {}),
    ...(sp.genre ? { genre: sp.genre } : {}),
    ...(sp.dateFrom ? { dateFrom: sp.dateFrom } : {}),
    ...(sp.dateTo ? { dateTo: sp.dateTo } : {}),
  })

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

  const visibleCount = Math.min(data.totalCount, page * 12)

  const trendingEvents = [...data.items]
    .sort((a, b) =>
      (b.goingCount * 2 + b.interestedCount + b.likesCount + b.savesCount) -
      (a.goingCount * 2 + a.interestedCount + a.likesCount + a.savesCount)
    )
    .slice(0, 4)

  const mapMarkers = data.items
    .filter(e => e.latitude != null && e.longitude != null)
    .map(e => ({
      eventId: e.id,
      title: e.title,
      city: e.city,
      address: e.address,
      startTime: e.startTime,
      genre: e.genre,
      imageUrl: mediaUrl(e.imageUrl),
      lat: e.latitude as number,
      lng: e.longitude as number,
      isApproximate: false,
    }))

  return (
    <div className="evt-shell">

      {/* Marquee */}
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

      {/* Hero */}
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
          <div className="evt-hero__stats">
            <span>
              <strong id="home-total-events-count">{data.totalCount}</strong>{' '}
              <span data-i18n="home.stats.nights">записани нощи</span>
            </span>
            <span>
              <strong id="home-city-count">{new Set(data.items.map(e => e.city)).size}</strong>{' '}
              <span data-i18n="home.stats.cities">града</span>
            </span>
            <span>
              <strong id="home-event-count">{mapMarkers.length}</strong>{' '}
              <span data-i18n="home.stats.pins">карфици</span>
            </span>
          </div>
        </div>

        {/* Map */}
        <HomeMap markers={mapMarkers} hasMarkers={mapMarkers.length > 0} />
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

      {/* Filter tabs + AI search */}
      <div id="home-filter-anchor" className="evt-search-section" data-filter-anchor data-filter-button-label="Филтри">
        <div id="home-filter-tabs" className="evt-search-tabs-bar">
          <Link className={`evt-search-tab-link ${isTabAll ? 'is-active' : ''}`} href="/">
            <i className="bi bi-grid-3x3-gap" /> <span data-i18n="search.tab.all">Всички</span>
          </Link>
          <Link className={`evt-search-tab-link ${isTabTonight ? 'is-active' : ''}`} href={`/?dateFrom=${todayStr}&dateTo=${todayStr}`}>
            <i className="bi bi-calendar-day" /> <span data-i18n="search.tab.tonight">Днес</span>
          </Link>
          <Link className={`evt-search-tab-link ${isTabWeekend ? 'is-active' : ''}`} href={`/?dateFrom=${nextSatStr}&dateTo=${nextSunStr}`}>
            <i className="bi bi-stars" /> <span data-i18n="search.tab.weekend">Уикенд</span>
          </Link>
          <Link className={`evt-search-tab-link ${isTabWeek ? 'is-active' : ''}`} href={`/?dateFrom=${todayStr}&dateTo=${endOfWeekStr}`}>
            <i className="bi bi-calendar-week" /> <span data-i18n="search.tab.week">Тази седмица</span>
          </Link>
          <Link className={`evt-search-tab-link ${isTabFree ? 'is-active' : ''}`} href="/?search=free">
            <i className="bi bi-ticket-perforated" /> <span data-i18n="chip.free">Безплатни</span>
          </Link>
        </div>

        {/* AI Search — client component */}
        <HomeFilters />
      </div>

      {/* Events section */}
      <section id="home-events-surface" className="evt-section" aria-live="polite">
        <div className="evt-section__head">
          <div>
            <h2 className="evt-section__title" data-i18n="home.events.discover">Открий своята вечер</h2>
            <p className="evt-section__sub" data-i18n="home.events.discover.sub">
              Подбрани събития, фестивали и партита около теб.
            </p>
          </div>
        </div>

        {/* Genre chips */}
        <div className="evt-toolbar">
          <div className="evt-chips">
            <Link className={`evt-chip ${isTabAll ? 'is-active' : ''}`} href="/" data-i18n="search.tab.all">Всички</Link>
            <Link className={`evt-chip ${sp.genre === 'LiveMusic' ? 'is-active' : ''}`} href="/?genre=LiveMusic" data-i18n="genre.LiveMusic">Live музика</Link>
            <Link className={`evt-chip ${sp.genre === 'Festival' ? 'is-active' : ''}`} href="/?genre=Festival" data-i18n="genre.Festival">Фестивал</Link>
            <Link className={`evt-chip ${sp.genre === 'Theater' ? 'is-active' : ''}`} href="/?genre=Theater" data-i18n="genre.Theater">Театър</Link>
            <Link className={`evt-chip ${isTabFree ? 'is-active' : ''}`} href="/?search=free" data-i18n="chip.free">Безплатни</Link>
            <Link className={`evt-chip ${sp.genre === 'Kids' ? 'is-active' : ''}`} href="/?genre=Kids" data-i18n="genre.Kids">За деца</Link>
            <Link className={`evt-chip ${sp.genre === 'Techno' ? 'is-active' : ''}`} href="/?genre=Techno" data-i18n="genre.Techno">Techno</Link>
            <Link className={`evt-chip ${sp.genre === 'House' ? 'is-active' : ''}`} href="/?genre=House" data-i18n="genre.House">House</Link>
            <Link className={`evt-chip ${sp.genre === 'Jazz' ? 'is-active' : ''}`} href="/?genre=Jazz" data-i18n="genre.Jazz">Jazz</Link>
          </div>
          <Link href="/events/new" className="evt-btn evt-btn-primary" style={{ padding: '8px 16px' }}>
            <i className="bi bi-plus-lg" /> <span data-i18n="home.events.create">Създай събитие</span>
          </Link>
        </div>

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
                    href={`/?page=${page + 1}${sp.search ? `&search=${sp.search}` : ''}${sp.genre ? `&genre=${sp.genre}` : ''}${sp.dateFrom ? `&dateFrom=${sp.dateFrom}` : ''}${sp.dateTo ? `&dateTo=${sp.dateTo}` : ''}`}
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
                    <span className="evt-trending__placeholder">
                      <i className="bi bi-calendar-event" />
                    </span>
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
      </section>
    </div>
  )
}
