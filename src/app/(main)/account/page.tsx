import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'
import type { AuthUser, EventCard, Post } from '@/types/api'
import { mediaUrl } from '@/lib/media'
import { PostCard } from '@/components/posts/PostCard'

interface AccountTicket {
  id: string
  eventTitle: string
  startTime?: string
  eventStartTime?: string
  city?: string
}

interface OnboardingChecklist {
  hasSavedEvent: boolean
  hasAttended: boolean
  hasFollowed: boolean
  hasViewedEvent: boolean
  isComplete?: boolean
}

interface AccountOverview {
  id?: string
  userName?: string
  email?: string
  phoneNumber?: string
  bio?: string
  profileImageUrl?: string
  createdAt?: string
  role?: string
  roles?: string[]
  hasApplied?: boolean
  isApproved?: boolean
  canCreatePosts?: boolean
  organizationName?: string
  applicationDate?: string
  eventsCount?: number
  postsCount?: number
  followersCount?: number
  followingCount?: number
  savedPostsCount?: number
  savedEventsCount?: number
  goingEventsCount?: number
  purchasedTicketsCount?: number
  myPosts?: Post[]
  savedPosts?: Post[]
  savedEvents?: EventCard[]
  recentTickets?: AccountTicket[]
  onboardingChecklist?: OnboardingChecklist | null
}

function count(value: number | undefined | null) {
  return value ?? 0
}

function normalizePost(post: Partial<Post>, account: AccountOverview, displayName: string): Post {
  return {
    id: post.id ?? 0,
    authorId: post.authorId ?? account.id ?? 'me',
    organizerProfileId: post.organizerProfileId,
    authorName: post.authorName ?? displayName,
    authorImageUrl: post.authorImageUrl ?? account.profileImageUrl,
    content: post.content ?? '',
    mediaType: post.mediaType,
    mediaUrl: post.mediaUrl,
    createdAt: post.createdAt ?? new Date().toISOString(),
    likesCount: count(post.likesCount),
    savesCount: count(post.savesCount),
    commentsCount: count(post.commentsCount),
    isLiked: post.isLiked ?? false,
    isSaved: post.isSaved ?? false,
    canEdit: post.canEdit ?? false,
    canDelete: post.canDelete ?? false,
    comments: post.comments,
  }
}

async function getAccount(): Promise<AccountOverview | null> {
  const sapi = await authenticatedServerApi()

  try {
    const res = await sapi.get<AccountOverview>('/api/account/overview')
    return res.data
  } catch {}

  try {
    const res = await sapi.get<AuthUser>('/api/auth/me')
    const user = res.data
    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      bio: user.bio,
      profileImageUrl: user.profileImageUrl,
      roles: user.roles,
      role: user.roles?.[0] ?? 'User',
      canCreatePosts: user.roles?.includes('Organizer') || user.roles?.includes('Admin'),
    }
  } catch {
    return null
  }
}

function EmptyPanel({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="social-empty-panel">
      <i className={`bi ${icon}`} />
      <span>{text}</span>
    </div>
  )
}

function AccountLinks({ children }: { children: React.ReactNode }) {
  return <div className="account-link-list">{children}</div>
}

export default async function AccountPage() {
  const account = await getAccount()

  if (!account) {
    return (
      <section className="groove-app-page">
        <div className="groove-empty-card">
          <i className="bi bi-person-circle" />
          <h1 className="groove-panel-title">Влез в акаунта си</h1>
          <p className="groove-panel-intro">Профилните настройки и историята са достъпни след вход.</p>
          <Link href="/login" className="groove-button groove-button-dark mt-3">
            <i className="bi bi-box-arrow-in-right" /> Вход
          </Link>
        </div>
      </section>
    )
  }

  const roles = account.roles ?? (account.role ? [account.role] : [])
  const isAdmin = roles.includes('Admin') || account.role === 'Admin'
  const isOrganizer = roles.includes('Organizer') || account.role === 'Organizer'
  const canCreatePosts = account.canCreatePosts ?? (isAdmin || isOrganizer)
  const displayName = account.userName || account.email || 'Профил'
  const initial = displayName[0]?.toUpperCase() ?? '?'
  const createdAt = account.createdAt ? new Date(account.createdAt) : null
  const checklist = account.onboardingChecklist
  const checklistComplete = checklist?.isComplete ?? (
    !!checklist && checklist.hasSavedEvent && checklist.hasAttended && checklist.hasFollowed && checklist.hasViewedEvent
  )
  const checklistDone = checklist ? [checklist.hasSavedEvent, checklist.hasAttended, checklist.hasFollowed, checklist.hasViewedEvent].filter(Boolean).length : 0
  const myPosts = (account.myPosts ?? []).map(post => normalizePost(post, account, displayName))
  const savedPosts = (account.savedPosts ?? []).map(post => normalizePost(post, account, displayName))

  return (
    <section className="groove-app-page account-overview-page">
      <article className="account-overview-hero">
        <div className="account-overview-hero__identity">
          <div className="groove-avatar">
            {account.profileImageUrl ? (
              <img src={mediaUrl(account.profileImageUrl)} alt={displayName} />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div>
            <span className="groove-stamp groove-stamp-red" data-i18n="account.title">Акаунт</span>
            <h1>{displayName}</h1>
            {account.email && <p>{account.email}</p>}
            <div className="groove-inline-actions">
              <span className="groove-badge">
                <i className="bi bi-calendar-check" /> <span data-i18n="account.since">От</span>{' '}
                {createdAt ? format(createdAt, 'MMMM yyyy') : 'скоро'}
              </span>
            </div>
          </div>
        </div>
        <div className="account-overview-hero__actions">
          <Link href="/account/edit" className="groove-button groove-button-dark">
            <i className="bi bi-person-gear" /> <span data-i18n="profile.edit">Редактирай профила</span>
          </Link>
          <Link href="/profile/me" className="groove-button groove-button-paper">
            <i className="bi bi-person-lines-fill" /> <span data-i18n="profile.public">Публичен профил</span>
          </Link>
          {canCreatePosts && (
            <Link href="/flow/new" className="groove-button groove-button-paper">
              <i className="bi bi-plus-square" /> <span data-i18n="post.create">Нова публикация</span>
            </Link>
          )}
          <Link href="/preferences" className="groove-button groove-button-paper">
            <i className="bi bi-sliders" /> <span data-i18n="account.preferences">Предпочитания</span>
          </Link>
        </div>
      </article>

      <section className="account-stat-strip">
        <Link href="/profile/me/followers"><strong>{count(account.followersCount)}</strong><span data-i18n="profile.followers">последователи</span></Link>
        <Link href="/profile/me/following"><strong>{count(account.followingCount)}</strong><span data-i18n="profile.following">следва</span></Link>
        {canCreatePosts && <span><strong>{count(account.postsCount)}</strong><span data-i18n="profile.posts">публикации</span></span>}
        <span><strong>{count(account.savedPostsCount)}</strong><span data-i18n="account.saved.posts">запазени публикации</span></span>
        <span><strong>{count(account.savedEventsCount)}</strong><span data-i18n="account.saved.events">запазени събития</span></span>
        <span><strong>{count(account.purchasedTicketsCount)}</strong><span data-i18n="org.btn.tickets">билети</span></span>
      </section>

      {checklist && (
        <div className={`evt-onboarding ${checklistComplete ? 'evt-onboarding--done' : ''}`}>
          {checklistComplete ? (
            <div className="evt-onboarding__celebrate">
              <i className="bi bi-stars" style={{ fontSize: '2rem', color: '#fbbf24' }} />
              <div>
                <p className="evt-onboarding__title mb-0">Перфектно! Открил си всичко.</p>
                <p className="mb-0" style={{ fontSize: '.82rem', opacity: .85 }}>Сега можеш да изследваш цялото Evento без ограничения.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="evt-onboarding__header">
                <div>
                  <span className="evt-onboarding__label">Първи стъпки</span>
                  <h3 className="evt-onboarding__title">Открий всичко, което Evento предлага</h3>
                </div>
              </div>
              <ul className="evt-onboarding__steps">
                <li className={checklist.hasSavedEvent ? 'is-done' : ''}>
                  <i className={`bi ${checklist.hasSavedEvent ? 'bi-bookmark-check-fill' : 'bi-bookmark'}`} />
                  <span>Запази любимо събитие</span>
                  {!checklist.hasSavedEvent && <Link href="/" className="evt-onboarding__do">Разгледай →</Link>}
                </li>
                <li className={checklist.hasAttended ? 'is-done' : ''}>
                  <i className={`bi ${checklist.hasAttended ? 'bi-check-circle-fill' : 'bi-circle'}`} />
                  <span>Запиши се за събитие</span>
                  {!checklist.hasAttended && <Link href="/" className="evt-onboarding__do">Намери →</Link>}
                </li>
                <li className={checklist.hasFollowed ? 'is-done' : ''}>
                  <i className={`bi ${checklist.hasFollowed ? 'bi-person-check-fill' : 'bi-person-plus'}`} />
                  <span>Последвай организатор или приятел</span>
                </li>
                <li className={checklist.hasViewedEvent ? 'is-done' : ''}>
                  <i className={`bi ${checklist.hasViewedEvent ? 'bi-eye-fill' : 'bi-eye'}`} />
                  <span>Отвори страница на събитие</span>
                  {!checklist.hasViewedEvent && <Link href="/" className="evt-onboarding__do">Откри →</Link>}
                </li>
              </ul>
              <div className="evt-onboarding__progress">
                <div className="evt-onboarding__bar">
                  <div className="evt-onboarding__fill" style={{ width: `${checklistDone * 25}%` }} />
                </div>
                <span className="evt-onboarding__count">{checklistDone} / 4</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="account-overview-grid">
        <main className="account-overview-main">
          {canCreatePosts ? (
            <section className="groove-page-section">
              <div className="groove-section-bar">
                <div>
                  <span className="groove-kicker" data-i18n="account.your.posts">Твоите публикации</span>
                  <h2 data-i18n-html="account.published">Това, което си <span>публикувал</span>.</h2>
                </div>
                <Link href="/flow/new" className="groove-link" data-i18n="home.events.create">Създай</Link>
              </div>
              {myPosts.length ? (
                <div className="social-post-list">{myPosts.map(post => <PostCard key={post.id} post={post} />)}</div>
              ) : (
                <EmptyPanel icon="bi-journal-plus" text="Все още нямаш публикации." />
              )}
            </section>
          ) : (
            <section className="groove-page-section">
              <div className="groove-section-bar">
                <div>
                  <span className="groove-kicker">Explore</span>
                  <h2>Event-first activity.</h2>
                </div>
              </div>
              <AccountLinks>
                <Link href="/"><i className="bi bi-search" /> Explore Events</Link>
                <Link href="/tickets"><i className="bi bi-ticket-perforated" /> My Tickets</Link>
                <Link href="/profile/me/following"><i className="bi bi-person-check" /> Following</Link>
                <Link href="/events/recommended"><i className="bi bi-stars" /> Recommended</Link>
              </AccountLinks>
            </section>
          )}

          <section className="groove-page-section">
            <div className="groove-section-bar">
              <div>
                <span className="groove-kicker" data-i18n="account.saved">Запазено</span>
                <h2 data-i18n-html="account.posts.keep">Публикации, които искаш да <span>запазиш</span>.</h2>
              </div>
            </div>
            {savedPosts.length ? (
              <div className="social-post-list">{savedPosts.map(post => <PostCard key={post.id} post={post} />)}</div>
            ) : (
              <EmptyPanel icon="bi-bookmark" text="Запазените публикации ще се появят тук." />
            )}
          </section>
        </main>

        <aside className="account-overview-side">
          <section className="social-side-panel">
            <span className="groove-kicker" data-i18n="account.quick.actions">Бързи действия</span>
            <AccountLinks>
              <Link href="/"><i className="bi bi-house-door" /> <span data-i18n="nav.home">Начало</span></Link>
              <Link href="/flow"><i className="bi bi-grid" /> <span data-i18n="nav.feed">Поток</span></Link>
              <Link href="/inbox"><i className="bi bi-chat-dots" /> <span data-i18n="nav.messages">Съобщения</span></Link>
              <Link href="/tickets"><i className="bi bi-ticket-perforated" /> <span data-i18n="nav.mytickets">Моите билети</span></Link>
              <Link href="/events/recommended"><i className="bi bi-stars" /> <span data-i18n="nav.recommended">Препоръчани</span></Link>
            </AccountLinks>
          </section>

          {(isAdmin || isOrganizer) ? (
            <section className="social-side-panel">
              <span className="groove-kicker" data-i18n="account.work.tools">Работни инструменти</span>
              <AccountLinks>
                {isOrganizer && <Link href="/organizer/dashboard"><i className="bi bi-speedometer2" /> <span data-i18n="organizer.dashboard">Организаторско табло</span></Link>}
                {isOrganizer && <Link href="/organizer/profiles"><i className="bi bi-person-badge" /> <span data-i18n="organizer.public.pages">Публични организаторски страници</span></Link>}
                <Link href="/tickets/validate"><i className="bi bi-qr-code-scan" /> <span data-i18n="nav.validate">Валидиране</span></Link>
                {isAdmin && <Link href="/admin"><i className="bi bi-shield-check" /> <span data-i18n="nav.admin">Админ</span></Link>}
                {isAdmin && <Link href="/admin/users"><i className="bi bi-people" /> <span data-i18n="account.users">Потребители</span></Link>}
              </AccountLinks>
            </section>
          ) : account.hasApplied ? (
            <section className="social-side-panel account-promo-panel">
              <span className="groove-kicker" data-i18n="account.application">Кандидатура</span>
              <h3 data-i18n="account.pending.review">Чака преглед.</h3>
              {account.organizationName && <p>{account.organizationName}</p>}
              <Link href="/account/edit-application" className="groove-link" data-i18n="account.edit.application">Редактирай кандидатурата</Link>
            </section>
          ) : (
            <section className="social-side-panel account-promo-panel">
              <span className="groove-kicker" data-i18n="profile.type.organizer">Организатор</span>
              <h3 data-i18n="account.apply.title">Започни да публикуваш събития.</h3>
              <p data-i18n="account.apply.desc">Кандидатствай, когато си готов да продаваш билети и да управляваш събития през Evento.</p>
              <Link href="/account/apply" className="groove-button groove-button-dark">
                <i className="bi bi-send" /> <span data-i18n="home.events.apply">Кандидатствай</span>
              </Link>
            </section>
          )}

          <section className="social-side-panel">
            <div className="social-side-panel__head">
              <span className="groove-kicker" data-i18n="account.saved.events">Запазени събития</span>
              <Link href="/" className="groove-link" data-i18n="account.explore">Разгледай</Link>
            </div>
            {account.savedEvents?.length ? account.savedEvents.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} className="social-event-mini">
                <span>{format(new Date(event.startTime), 'dd MMM')}</span>
                <strong>{event.title}</strong>
                <small>{event.city}</small>
              </Link>
            )) : (
              <div className="social-empty-inline" data-i18n="account.saved.events.empty">Запазените събития ще се появят тук.</div>
            )}
          </section>

          <section className="social-side-panel">
            <div className="social-side-panel__head">
              <span className="groove-kicker" data-i18n="org.btn.tickets">Билети</span>
              <Link href="/tickets" className="groove-link" data-i18n="feed.all">Всички</Link>
            </div>
            {account.recentTickets?.length ? (
              <div className="account-ticket-list">
                {account.recentTickets.map(ticket => {
                  const start = ticket.startTime ?? ticket.eventStartTime
                  return (
                    <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                      <strong>{ticket.eventTitle}</strong>
                      <small>{start ? format(new Date(start), 'dd.MM.yyyy HH:mm') : 'Няма дата'}{ticket.city ? ` - ${ticket.city}` : ''}</small>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="social-empty-inline" data-i18n="account.no.tickets">Все още няма купени билети.</div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}
