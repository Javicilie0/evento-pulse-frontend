import { format } from 'date-fns'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { auth } from '@/lib/auth'
import { mediaUrl } from '@/lib/media'
import { authenticatedServerApi } from '@/lib/serverApi'
import { PostCard } from '@/components/posts/PostCard'
import type { EventCard as EventCardType, PaginatedResult, Post } from '@/types/api'

interface Props {
  searchParams: Promise<{
    filter?: string
    sort?: string
    q?: string
    page?: string
  }>
}

type ApiPost = Partial<Post> & {
  organizerId?: string
  organizerName?: string
  firstMediaUrl?: string
  firstMediaType?: string
  currentUserLiked?: boolean
  currentUserSaved?: boolean
}

interface ProfileSummary {
  id: string
  userId?: string
  organizerProfileId?: number
  displayName?: string
  userName?: string
  bio?: string
  profileImageUrl?: string
  isOrganizer?: boolean
  typeKey?: string
  typeText?: string
  followersCount?: number
  followerCount?: number
  postsCount?: number
  eventsCount?: number
  currentUserFollows?: boolean
}

interface FeedExtras {
  friendsActivity: Post[]
  recommendedEvents: EventCardType[]
  trendingEvents: EventCardType[]
  suggestedProfiles: ProfileSummary[]
  searchResults: ProfileSummary[]
}

const FILTERS = [
  { key: 'all', labelKey: 'feed.filter.all', label: 'Всички', icon: 'bi-grid-3x3-gap' },
  { key: 'following', labelKey: 'feed.filter.following', label: 'Следвани', icon: 'bi-person-heart' },
  { key: 'events', labelKey: 'feed.filter.events', label: 'За събития', icon: 'bi-calendar-event' },
  { key: 'media', labelKey: 'feed.filter.media', label: 'С медия', icon: 'bi-image' },
  { key: 'saved', labelKey: 'feed.filter.saved', label: 'Запазени', icon: 'bi-bookmark' },
  { key: 'hot', labelKey: 'feed.filter.hot', label: 'Най-активни', icon: 'bi-fire' },
]

const TITLE_BY_FILTER: Record<string, { key: string; text: string; emptyKey: string; emptyText: string }> = {
  following: {
    key: 'feed.main.following',
    text: 'Постове от хората и страниците, които следиш.',
    emptyKey: 'feed.filter.empty',
    emptyText: 'Няма публикации за този филтър.',
  },
  events: {
    key: 'feed.main.events',
    text: 'Публикации, вързани към събития.',
    emptyKey: 'feed.filter.empty',
    emptyText: 'Няма публикации за този филтър.',
  },
  media: {
    key: 'feed.main.media',
    text: 'Постове със снимки и видео.',
    emptyKey: 'feed.filter.empty',
    emptyText: 'Няма публикации за този филтър.',
  },
  saved: {
    key: 'feed.main.saved',
    text: 'Твоите запазени публикации.',
    emptyKey: 'feed.filter.empty',
    emptyText: 'Няма публикации за този филтър.',
  },
  hot: {
    key: 'feed.main.hot',
    text: 'Постове с най-много реакции.',
    emptyKey: 'feed.filter.empty',
    emptyText: 'Няма публикации за този филтър.',
  },
  all: {
    key: 'feed.posts.title',
    text: 'Новини от организатори и свежи постове.',
    emptyKey: 'profile.no.posts',
    emptyText: 'Все още няма публикации.',
  },
}

function normalizePost(post: ApiPost): Post {
  return {
    id: Number(post.id ?? 0),
    authorId: post.authorId ?? post.organizerId ?? '',
    organizerProfileId: post.organizerProfileId,
    authorName: post.authorName ?? post.organizerName ?? 'Evento',
    authorImageUrl: post.authorImageUrl,
    content: post.content ?? '',
    mediaType: post.mediaType ?? post.firstMediaType,
    mediaUrl: post.mediaUrl ?? post.firstMediaUrl,
    createdAt: post.createdAt ?? new Date().toISOString(),
    likesCount: post.likesCount ?? 0,
    savesCount: post.savesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
    isLiked: post.isLiked ?? post.currentUserLiked ?? false,
    isSaved: post.isSaved ?? post.currentUserSaved ?? false,
    canEdit: post.canEdit ?? false,
    canDelete: post.canDelete ?? false,
    comments: post.comments ?? [],
  }
}

function normalizePosts(items: ApiPost[] | undefined) {
  return (items ?? []).filter(item => item.id != null).map(normalizePost)
}

function unwrapItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (Array.isArray(record.items)) return record.items as T[]
    if (Array.isArray(record.results)) return record.results as T[]
    if (Array.isArray(record.profiles)) return record.profiles as T[]
    if (Array.isArray(record.users)) return record.users as T[]
  }
  return []
}

async function getPosts(params: Record<string, string>) {
  try {
    const res = await (await authenticatedServerApi()).get<PaginatedResult<ApiPost> | ApiPost[]>('/api/posts', { params })
    const raw = res.data
    if (Array.isArray(raw)) {
      return { items: normalizePosts(raw), totalCount: raw.length, page: 1, pageSize: raw.length, hasMore: false }
    }

    return {
      ...raw,
      items: normalizePosts(raw.items),
      totalCount: raw.totalCount ?? raw.items?.length ?? 0,
      page: raw.page ?? Number(params.page ?? 1),
      pageSize: raw.pageSize ?? Number(params.pageSize ?? 12),
      hasMore: raw.hasMore ?? false,
    }
  } catch {
    return { items: [], totalCount: 0, page: 1, pageSize: 12, hasMore: false }
  }
}

async function getEvents(params: Record<string, string>) {
  try {
    const res = await (await authenticatedServerApi()).get<PaginatedResult<EventCardType>>('/api/events', { params })
    return res.data.items ?? []
  } catch {
    return []
  }
}

async function getProfiles(paths: string[]) {
  const sapi = await authenticatedServerApi()
  for (const path of paths) {
    try {
      const res = await sapi.get<unknown>(path)
      const items = unwrapItems<ProfileSummary>(res.data)
      if (items.length > 0) return items
    } catch {
      // The separated API has changed names a few times; try the next known shape.
    }
  }
  return []
}

async function getFeedExtras(q?: string): Promise<FeedExtras> {
  const [followingPosts, recommendedEvents, trendingEvents, suggestedProfiles, searchResults] = await Promise.all([
    getPosts({ page: '1', pageSize: '8', filter: 'following' }),
    getEvents({ page: '1', pageSize: '8', sort: 'soon' }),
    getEvents({ page: '1', pageSize: '8', sort: 'popular' }),
    getProfiles(['/api/profiles/suggested?take=6', '/api/profiles?take=6']),
    q
      ? getProfiles([
          `/api/profiles/search?q=${encodeURIComponent(q)}`,
          `/api/profiles?search=${encodeURIComponent(q)}`,
          `/api/search?q=${encodeURIComponent(q)}`,
        ])
      : Promise.resolve([]),
  ])

  return {
    friendsActivity: followingPosts.items,
    recommendedEvents,
    trendingEvents,
    suggestedProfiles,
    searchResults,
  }
}

function formatDate(value?: string, pattern = 'dd.MM HH:mm') {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : format(date, pattern)
}

function profileInitial(profile: ProfileSummary) {
  return (profile.displayName?.trim()[0] ?? profile.userName?.trim()[0] ?? '?').toUpperCase()
}

function profileName(profile: ProfileSummary) {
  return profile.displayName || profile.userName || 'Профил'
}

function profileHref(profile: ProfileSummary) {
  if (profile.organizerProfileId) return `/pages/${profile.organizerProfileId}`
  return `/profile/${profile.userId ?? profile.id}`
}

function ProfileAvatar({ profile }: { profile: ProfileSummary }) {
  return (
    <span className="social-profile-avatar">
      {profile.profileImageUrl && <img src={mediaUrl(profile.profileImageUrl)} alt={profileName(profile)} />}
      <span>{profileInitial(profile)}</span>
    </span>
  )
}

function SearchResults({ query, results }: { query?: string; results: ProfileSummary[] }) {
  if (!query) return null

  return (
    <div className="social-search-results">
      <div className="social-search-results__head">
        <span className="groove-kicker" data-i18n="feed.search.results">Резултати</span>
        <strong>{query}</strong>
      </div>
      {results.length === 0 ? (
        <div className="social-empty-inline" data-i18n="feed.search.empty">Няма намерени профили или публични страници.</div>
      ) : (
        <div className="social-search-results__grid">
          {results.map(result => (
            <article key={`${result.organizerProfileId ?? result.userId ?? result.id}`} className="social-search-card">
              <Link href={profileHref(result)} className="social-search-card__main">
                <ProfileAvatar profile={result} />
                <span className="social-search-card__body">
                  <strong>{profileName(result)}</strong>
                  <small>
                    <span data-i18n={result.typeKey ?? (result.isOrganizer ? 'profile.type.organizer' : 'profile.type.profile')}>
                      {result.typeText ?? (result.isOrganizer ? 'Организатор' : 'Профил')}
                    </span>
                    {result.userName && <span>@{result.userName}</span>}
                  </small>
                  {result.bio && <span className="social-search-card__bio">{result.bio}</span>}
                  <span className="social-search-card__meta">
                    {result.followersCount ?? result.followerCount ?? 0} <span data-i18n="profile.followers">последователи</span>
                    {' · '}
                    {result.eventsCount ?? 0} <span data-i18n="profile.events">събития</span>
                    {' · '}
                    {result.postsCount ?? 0} <span data-i18n="profile.posts">поста</span>
                  </span>
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function EventMini({ event, trending = false }: { event: EventCardType; trending?: boolean }) {
  return (
    <Link href={`/events/${event.id}`} className="social-event-mini">
      <span className="social-event-mini__thumb">
        {event.imageUrl ? <img src={mediaUrl(event.imageUrl)} alt={event.title} /> : <i className={`bi ${trending ? 'bi-fire' : 'bi-calendar-event'}`} />}
      </span>
      <span>{trending ? <i className="bi bi-fire" /> : formatDate(event.startTime, 'dd MMM')}</span>
      <span className="social-event-mini__body">
        <strong>{event.title}</strong>
        <small>
          {trending
            ? `${event.goingCount ?? 0} Отивам · ${event.interestedCount ?? 0} Интересува ме`
            : event.city}
        </small>
      </span>
    </Link>
  )
}

function DiscoveryStrip({ profiles, recommendedEvents, trendingEvents }: {
  profiles: ProfileSummary[]
  recommendedEvents: EventCardType[]
  trendingEvents: EventCardType[]
}) {
  if (profiles.length === 0 && recommendedEvents.length === 0 && trendingEvents.length === 0) return null

  return (
    <section className="social-feed-discovery-strip" aria-label="Suggested for you">
      <div className="social-feed-discovery-strip__head">
        <div>
          <span className="groove-kicker" data-i18n="feed.discover.kicker">Discover</span>
          <strong data-i18n="feed.discover.title">Suggested for you</strong>
        </div>
        <span data-i18n="feed.discover.swipe">Swipe</span>
      </div>

      <div className="social-feed-discovery-rail">
        {profiles.slice(0, 8).map(profile => (
          <article key={`profile-${profile.id}`} className="social-feed-discovery-card social-feed-discovery-card--profile">
            <Link href={profileHref(profile)} className="social-feed-discovery-card__main">
              <ProfileAvatar profile={profile} />
              <span>
                <strong>{profileName(profile)}</strong>
                <small>
                  <span data-i18n={profile.isOrganizer ? 'profile.type.organizer' : 'profile.type.profile'}>
                    {profile.isOrganizer ? 'Организатор' : 'Профил'}
                  </span>
                  {' · '}
                  {profile.followersCount ?? profile.followerCount ?? 0} <span data-i18n="profile.followers">followers</span>
                </small>
              </span>
            </Link>
          </article>
        ))}

        {recommendedEvents.slice(0, 4).map(event => (
          <Link key={`recommended-${event.id}`} href={`/events/${event.id}`} className="social-feed-discovery-card social-feed-discovery-card--event">
            <span className="social-feed-discovery-card__thumb">
              {event.imageUrl ? <img src={mediaUrl(event.imageUrl)} alt={event.title} /> : <i className="bi bi-calendar-event" />}
            </span>
            <span>
              <em data-i18n="profile.events">Events</em>
              <strong>{event.title}</strong>
              <small>{event.city} · {formatDate(event.startTime)}</small>
            </span>
          </Link>
        ))}

        {trendingEvents.slice(0, 4).map(event => (
          <Link key={`trending-${event.id}`} href={`/events/${event.id}`} className="social-feed-discovery-card social-feed-discovery-card--event">
            <span className="social-feed-discovery-card__thumb">
              {event.imageUrl ? <img src={mediaUrl(event.imageUrl)} alt={event.title} /> : <i className="bi bi-fire" />}
            </span>
            <span>
              <em data-i18n="home.trending.tab.trend">Trending</em>
              <strong>{event.title}</strong>
              <small>{event.goingCount ?? 0} <span data-i18n="event.action.going">Going</span> · {event.interestedCount ?? 0} <span data-i18n="event.action.interested">Interested</span></small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function PostList({ posts, insertDiscovery, discovery }: { posts: Post[]; insertDiscovery?: boolean; discovery: ReactNode }) {
  return (
    <div className="social-post-list social-post-list--stream" data-progressive-list data-initial-count={insertDiscovery ? 4 : 8} data-step-count={insertDiscovery ? 4 : 6}>
      {posts.map((post, index) => (
        <FragmentWithDiscovery key={post.id} post={post} index={index} insertDiscovery={insertDiscovery} discovery={discovery} />
      ))}
    </div>
  )
}

function FragmentWithDiscovery({ post, index, insertDiscovery, discovery }: {
  post: Post
  index: number
  insertDiscovery?: boolean
  discovery: ReactNode
}) {
  return (
    <>
      <div data-progressive-item>
        <PostCard post={post} />
      </div>
      {insertDiscovery && index === 1 && discovery && (
        <div data-progressive-item className="social-feed-discovery-item">
          {discovery}
        </div>
      )}
    </>
  )
}

export default async function FlowPage({ searchParams }: Props) {
  const sp = await searchParams
  const session = await auth()
  const page = Number(sp.page ?? 1)
  const filter = sp.filter ?? 'all'
  const sort = filter === 'hot' ? 'popular' : sp.sort ?? 'recent'
  const roles = session?.user?.roles ?? []
  const canCreatePublicContent = roles.includes('Organizer') || roles.includes('Admin')

  const data = await getPosts({
    page: String(page),
    pageSize: '12',
    ...(filter !== 'all' ? { filter } : {}),
    ...(sort !== 'recent' ? { sort } : {}),
    ...(sp.q ? { q: sp.q } : {}),
  })
  const extras = await getFeedExtras(sp.q)
  const title = TITLE_BY_FILTER[filter] ?? TITLE_BY_FILTER.all
  const visibleCount = Math.min(data.totalCount || data.items.length, page * data.pageSize)
  const showDiscoveryStrip = filter === 'all' && (
    extras.suggestedProfiles.length > 0 ||
    extras.recommendedEvents.length > 0 ||
    extras.trendingEvents.length > 0
  )
  const discovery = showDiscoveryStrip ? (
    <DiscoveryStrip
      profiles={extras.suggestedProfiles}
      recommendedEvents={extras.recommendedEvents}
      trendingEvents={extras.trendingEvents}
    />
  ) : null

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const merged = { filter: sp.filter, sort: sp.sort, q: sp.q, page: sp.page, ...overrides }
    const qs = Object.entries(merged)
      .filter(([, v]) => v && v !== 'all' && v !== 'recent')
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&')
    return `/flow${qs ? `?${qs}` : ''}`
  }

  return (
    <section className="groove-feed-page social-feed-page social-feed-page--stream">
      <header className="social-feed-topbar">
        <div>
          <span className="groove-stamp groove-stamp-teal" data-i18n="feed.kicker">Discover</span>
          <h1 data-i18n="feed.title">Събития, организатори и новини от сцената.</h1>
        </div>
        {canCreatePublicContent && (
          <Link href="/account" className="groove-button groove-button-paper">
            <i className="bi bi-columns-gap" /> <span data-i18n="account.overview">Преглед</span>
          </Link>
        )}
      </header>

      <section className="social-feed-search" id="feed-filter-anchor" data-filter-anchor data-filter-button-label="Филтри">
        <form method="GET" action="/flow" className="social-feed-search__form">
          <i className="bi bi-search" />
          <input
            type="text"
            inputMode="search"
            name="q"
            defaultValue={sp.q}
            placeholder="Търси хора, @username или публична страница..."
            data-i18n-placeholder="feed.search.placeholder"
            data-mobile-lazy-input
            autoComplete="off"
          />
          <input type="hidden" name="filter" value={filter !== 'all' ? filter : ''} />
          <input type="hidden" name="sort" value={sort} />
          <button type="submit" className="groove-button groove-button-primary" data-i18n="feed.search.action">Търси</button>
          {sp.q && (
            <Link href="/flow" className="groove-button groove-button-paper" data-i18n="common.clear">Изчисти</Link>
          )}
        </form>

        <div className="social-feed-filter-panel">
          <div className="social-feed-filter-rail" aria-label="Feed filters">
            {FILTERS.map(option => (
              <Link
                key={option.key}
                href={buildHref({ filter: option.key === 'all' ? undefined : option.key, page: undefined })}
                className={`social-feed-filter-chip ${filter === option.key ? 'is-active' : ''}`}
              >
                <i className={`bi ${option.icon}`} />
                <span data-i18n={option.labelKey}>{option.label}</span>
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
            <button type="submit" className="visually-hidden">Apply</button>
          </form>
        </div>

        <SearchResults query={sp.q} results={extras.searchResults} />
      </section>

      <div className="social-feed-shell social-feed-shell--stream">
        <main className="social-feed-main">
          {filter === 'all' && extras.friendsActivity.length > 0 && (
            <section className="social-feed-section social-feed-section--stream">
              <div className="social-section-heading social-section-heading--compact">
                <div>
                  <span className="groove-kicker" data-i18n="feed.following.kicker">Следиш</span>
                  <h2 data-i18n="feed.following.title">Съдържание от следвани организатори.</h2>
                </div>
              </div>
              <PostList posts={extras.friendsActivity} insertDiscovery={showDiscoveryStrip} discovery={discovery} />
              {extras.friendsActivity.length > 4 && (
                <div className="evt-load-more evt-load-more--compact">
                  <button type="button" className="evt-btn evt-btn-ghost" data-progressive-more>
                    <i className="bi bi-plus-circle" />
                    <span data-i18n="common.show.more">Покажи още</span>
                  </button>
                </div>
              )}
            </section>
          )}

          <section className="social-feed-section social-feed-section--stream">
            <div className="social-section-heading social-section-heading--compact">
              <div>
                <span className="groove-kicker" data-i18n="feed.posts.kicker">Публикации</span>
                <h2 data-i18n={title.key}>{title.text}</h2>
              </div>
              <span className="social-feed-count-pill" title={title.text}>
                <i className="bi bi-layers" />
                {visibleCount}
              </span>
            </div>

            {data.items.length > 0 ? (
              <>
                <PostList posts={data.items} insertDiscovery={showDiscoveryStrip && extras.friendsActivity.length === 0} discovery={discovery} />
                {data.hasMore && (
                  <div className="evt-load-more evt-load-more--compact">
                    <Link href={buildHref({ page: String(page + 1) })} className="evt-btn evt-btn-ghost">
                      <i className="bi bi-plus-circle" />
                      <span data-i18n="common.show.more">Покажи още</span>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <>
                {showDiscoveryStrip && extras.friendsActivity.length === 0 && discovery}
                <div className="social-empty-panel">
                  <i className="bi bi-journal-text" />
                  <span data-i18n={title.emptyKey}>{title.emptyText}</span>
                </div>
              </>
            )}
          </section>
        </main>

        <aside className="social-feed-aside social-feed-aside--overview">
          <section className="social-side-panel social-side-panel--quick">
            <div className="social-side-panel__head">
              <span className="groove-kicker" data-i18n="profile.events">Събития</span>
              <Link href="/" className="groove-link" data-i18n="feed.all">Всички</Link>
            </div>
            {extras.recommendedEvents.length > 0
              ? extras.recommendedEvents.slice(0, 3).map(event => <EventMini key={event.id} event={event} />)
              : <div className="social-empty-inline">Няма препоръчани събития.</div>}
          </section>

          <section className="social-side-panel social-side-panel--quick">
            <div className="social-side-panel__head">
              <span className="groove-kicker" data-i18n="home.trending.tab.trend">Тренд</span>
              <Link href="/events/recommended" className="groove-link" data-i18n="feed.more">Още</Link>
            </div>
            {extras.trendingEvents.length > 0
              ? extras.trendingEvents.slice(0, 3).map(event => <EventMini key={event.id} event={event} trending />)
              : <div className="social-empty-inline">Все още няма достатъчно реакции.</div>}
          </section>

          <section className="social-side-panel">
            <span className="groove-kicker" data-i18n="feed.suggested">Предложени профили</span>
            {extras.suggestedProfiles.length > 0 ? (
              extras.suggestedProfiles.slice(0, 5).map(profile => (
                <article key={profile.id} className="social-profile-row">
                  <Link href={profileHref(profile)} className="social-profile-row__main">
                    <ProfileAvatar profile={profile} />
                    <div className="social-profile-row__text">
                      <strong>{profileName(profile)}</strong>
                      <small>
                        <span data-i18n={profile.isOrganizer ? 'profile.type.organizer' : 'profile.type.profile'}>
                          {profile.isOrganizer ? 'Организатор' : 'Профил'}
                        </span>
                        {' · '}
                        {profile.followersCount ?? profile.followerCount ?? 0} <span data-i18n="profile.followers">последователи</span>
                      </small>
                    </div>
                  </Link>
                </article>
              ))
            ) : (
              <div className="social-empty-inline">Няма предложени профили.</div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}
