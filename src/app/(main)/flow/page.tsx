import { authenticatedServerApi } from '@/lib/serverApi'
import { PostCard } from '@/components/posts/PostCard'
import Link from 'next/link'
import type { Post, PaginatedResult } from '@/types/api'

interface Props {
  searchParams: Promise<{
    filter?: string
    sort?: string
    q?: string
    page?: string
  }>
}

const FILTERS = [
  { key: 'all', labelKey: 'feed.filter.all', label: 'Всички', icon: 'bi-grid-3x3-gap' },
  { key: 'following', labelKey: 'feed.filter.following', label: 'Следвани', icon: 'bi-person-heart' },
  { key: 'events', labelKey: 'feed.filter.events', label: 'За събития', icon: 'bi-calendar-event' },
  { key: 'media', labelKey: 'feed.filter.media', label: 'С медия', icon: 'bi-image' },
  { key: 'saved', labelKey: 'feed.filter.saved', label: 'Запазени', icon: 'bi-bookmark' },
  { key: 'hot', labelKey: 'feed.filter.hot', label: 'Най-активни', icon: 'bi-fire' },
]

async function getPosts(params: Record<string, string>) {
  try {
    const res = await (await authenticatedServerApi()).get<PaginatedResult<Post>>('/api/posts', { params })
    return res.data
  } catch {
    return { items: [], totalCount: 0, page: 1, pageSize: 12, hasMore: false }
  }
}

export default async function FlowPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = Number(sp.page ?? 1)
  const filter = sp.filter ?? 'all'
  const sort = sp.sort ?? 'recent'

  const data = await getPosts({
    page: String(page),
    pageSize: '12',
    ...(filter !== 'all' ? { filter } : {}),
    ...(sort !== 'recent' ? { sort } : {}),
    ...(sp.q ? { q: sp.q } : {}),
  })

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const merged = { filter: sp.filter, sort: sp.sort, q: sp.q, ...overrides }
    const qs = Object.entries(merged).filter(([, v]) => v && v !== 'all' && v !== 'recent').map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
    return `/flow${qs ? `?${qs}` : ''}`
  }

  return (
    <section className="groove-feed-page social-feed-page social-feed-page--stream">
      <header className="social-feed-topbar">
        <div>
          <span className="groove-stamp groove-stamp-teal" data-i18n="feed.kicker">Discover</span>
          <h1 data-i18n="feed.title">Събития, организатори и новини от сцената.</h1>
        </div>
        <Link href="/flow/new" className="groove-button groove-button-dark">
          <i className="bi bi-plus-lg" /> <span data-i18n="post.create">Нов пост</span>
        </Link>
      </header>

      <section className="social-feed-search" id="feed-filter-anchor" data-filter-anchor data-filter-button-label="Филтри">
        <form method="GET" action="/flow" className="social-feed-search__form">
          <i className="bi bi-search" />
          <input
            type="text"
            name="q"
            defaultValue={sp.q}
            placeholder="Търси хора, @username или публична страница..."
            data-i18n-placeholder="feed.search.placeholder"
            autoComplete="off"
            className="form-control border-0 bg-transparent"
          />
          <input type="hidden" name="filter" value={filter !== 'all' ? filter : ''} />
          <input type="hidden" name="sort" value={sort} />
          <button type="submit" className="groove-button groove-button-primary" data-i18n="feed.search.action">Търси</button>
          {sp.q && (
            <Link href={buildHref({ q: undefined })} className="groove-button groove-button-paper" data-i18n="common.clear">Изчисти</Link>
          )}
        </form>

        <div className="social-feed-filter-panel">
          <div className="social-feed-filter-rail" aria-label="Feed filters">
            {FILTERS.map(f => (
              <Link
                key={f.key}
                href={buildHref({ filter: f.key === 'all' ? undefined : f.key, page: undefined })}
                className={`social-feed-filter-chip ${filter === f.key ? 'is-active' : ''}`}
              >
                <i className={`bi ${f.icon}`} />
                <span data-i18n={f.labelKey}>{f.label}</span>
              </Link>
            ))}
          </div>
          <form method="GET" action="/flow" className="social-feed-sort-form">
            <input type="hidden" name="q" value={sp.q ?? ''} />
            <input type="hidden" name="filter" value={filter !== 'all' ? filter : ''} />
            <label htmlFor="feed-sort" data-i18n="feed.sort.label">Подреди</label>
            <select id="feed-sort" name="sort" defaultValue={sort}>
              <option value="recent" data-i18n="feed.sort.recent">Най-нови</option>
              <option value="popular" data-i18n="feed.sort.popular">Популярни</option>
              <option value="discussed" data-i18n="feed.sort.discussed">С разговор</option>
            </select>
          </form>
        </div>
      </section>

      {data.items.length === 0 ? (
        <div className="groove-empty-card mt-4">
          <i className="bi bi-grid-3x3-gap" />
          <h2 className="groove-panel-title" data-i18n="profile.no.posts">Все още няма публикации.</h2>
        </div>
      ) : (
        <>
          <div className="social-feed-grid mt-4">
            {data.items.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {data.hasMore && (
            <div className="evt-load-more mt-4">
              <Link href={buildHref({ page: String(page + 1) })} className="groove-button groove-button-paper">
                <i className="bi bi-plus-circle" /> <span data-i18n="common.show.more">Покажи още</span>
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}
