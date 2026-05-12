import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { AuthUser, EventCard as EventCardType, Post, UserProfile } from '@/types/api'
import { mediaUrl } from '@/lib/media'
import { ProfileActions } from './ProfileActions'
import { EventCard } from '@/components/events/EventCard'
import { PostCard } from '@/components/posts/PostCard'

interface Props {
  params: Promise<{ id: string }>
}

async function getProfile(id: string): Promise<UserProfile | null> {
  const sapi = await authenticatedServerApi()
  const readProfile = async (path: string) => {
    const res = await sapi.get<UserProfile>(path)
    return res.data
  }

  try {
    return await readProfile(`/api/profiles/${encodeURIComponent(id)}`)
  } catch {}

  if (id.toLowerCase() === 'me') {
    try {
      return await readProfile('/api/profiles/me')
    } catch {}

    try {
      const res = await sapi.get<AuthUser>('/api/auth/me')
      const me = res.data
      if (me.id) {
        try {
          return await readProfile(`/api/profiles/${encodeURIComponent(me.id)}`)
        } catch {}
      }

      return {
        id: me.id || me.userName || 'me',
        userName: me.userName,
        firstName: me.firstName,
        lastName: me.lastName,
        profileImageUrl: me.profileImageUrl,
        bio: me.bio,
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
        isOwnProfile: true,
        roles: me.roles ?? [],
      }
    } catch {}
  }

  try {
    return await readProfile(`/api/profiles/by-name/${encodeURIComponent(id)}`)
  } catch {}

  try {
    return await readProfile(`/api/profiles/username/${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

function count(value: number | undefined | null) {
  return value ?? 0
}

function normalizeEvent(event: Partial<EventCardType>): EventCardType {
  return {
    id: event.id ?? 0,
    title: event.title ?? 'Събитие',
    description: event.description ?? '',
    startTime: event.startTime ?? new Date().toISOString(),
    endTime: event.endTime ?? event.startTime ?? new Date().toISOString(),
    genre: event.genre ?? 'Other',
    imageUrl: event.imageUrl,
    address: event.address ?? '',
    city: event.city ?? '',
    latitude: event.latitude,
    longitude: event.longitude,
    organizerName: event.organizerName ?? '',
    organizerProfileId: event.organizerProfileId,
    likesCount: count(event.likesCount),
    savesCount: count(event.savesCount),
    goingCount: count(event.goingCount),
    interestedCount: count(event.interestedCount),
    isLiked: event.isLiked ?? false,
    isSaved: event.isSaved ?? false,
    userAttendanceStatus: event.userAttendanceStatus ?? null,
  }
}

function normalizePost(post: Partial<Post>, profile: UserProfile, displayName: string): Post {
  return {
    id: post.id ?? 0,
    authorId: post.authorId ?? profile.id,
    organizerProfileId: post.organizerProfileId,
    authorName: post.authorName ?? displayName,
    authorImageUrl: post.authorImageUrl ?? profile.profileImageUrl,
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

function EmptyPanel({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="profile-empty-state">
      <i className={`bi ${icon}`} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const profile = await getProfile(id)
  if (!profile) return notFound()

  const isCurrentUser = profile.isCurrentUser ?? profile.isOwnProfile
  const isFollowing = profile.currentUserFollows ?? profile.isFollowing
  const followersCount = profile.followersCount ?? profile.followerCount ?? 0
  const followingCount = profile.followingCount ?? profile.followingCountLegacy ?? 0
  const displayName = profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.userName || 'Профил'
  const initial = (displayName[0] ?? '?').toUpperCase()
  const isOrganizer = profile.isOrganizer ?? profile.roles?.includes('Organizer') ?? false
  const profileHref = `/profile/${profile.id}`
  const events = (profile.events ?? []).map(normalizeEvent)
  const sharedEvents = (profile.sharedEvents ?? []).map(normalizeEvent)
  const goingEvents = (profile.goingEvents ?? []).map(normalizeEvent)
  const savedEvents = (profile.savedEvents ?? []).map(normalizeEvent)
  const pinnedEvent = profile.pinnedEvent ? normalizeEvent(profile.pinnedEvent) : null
  const posts = (profile.posts ?? []).map(post => normalizePost(post, profile, displayName))
  const memories = profile.memories ?? []

  return (
    <section className="groove-app-page social-profile-page">
      <article className="social-profile-hero">
        <div className="social-profile-hero__avatar">
          {profile.profileImageUrl ? (
            <img src={mediaUrl(profile.profileImageUrl)} alt={displayName} />
          ) : (
            <span className="evt-avatar-circle">{initial}</span>
          )}
        </div>

        <div className="social-profile-hero__body">
          <span className={`groove-stamp ${isOrganizer ? 'groove-stamp-teal' : 'groove-stamp-red'}`}>
            {isOrganizer ? 'Organizer' : 'Profile'}
          </span>
          <h1>{displayName}</h1>
          {profile.userName && <p className="social-profile-username text-muted">@{profile.userName}</p>}
          {profile.bio && <p>{profile.bio}</p>}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="groove-link">
              <i className="bi bi-box-arrow-up-right" /> <span data-i18n="profile.website">Website</span>
            </a>
          )}

          <div className="social-profile-stats">
            <Link href={`${profileHref}/followers`}>
              <strong>{followersCount}</strong>
              <span data-i18n="profile.followers"> последователи</span>
            </Link>
            <Link href={`${profileHref}/following`}>
              <strong>{followingCount}</strong>
              <span data-i18n="profile.following"> следвани</span>
            </Link>
            {isOrganizer ? (
              <>
                <span><strong>{count(profile.postsCount)}</strong><span data-i18n="profile.posts"> posts</span></span>
                <span><strong>{count(profile.eventsCount)}</strong><span data-i18n="profile.events"> events</span></span>
              </>
            ) : (
              <>
                <span><strong>{count(profile.goingEventsCount)}</strong><span> going</span></span>
                <span><strong>{count(profile.savedEventsCount)}</strong><span> saved</span></span>
              </>
            )}
          </div>

          {!isCurrentUser && (
            <ProfileActions profileId={profile.id} initialIsFollowing={isFollowing} initialFollowerCount={followersCount} />
          )}

          {isCurrentUser && (
            <div className="groove-cta-row mt-3">
              <Link href="/account/edit" className="groove-button groove-button-dark">
                <i className="bi bi-person-gear" /> <span data-i18n="profile.edit">Edit profile</span>
              </Link>
            </div>
          )}
        </div>
      </article>

      {memories.length > 0 && (
        <section className="evt-memories">
          <div className="evt-memories__head">
            <span className="evt-memories__icon"><i className="bi bi-clock-history" /></span>
            <div>
              <strong data-i18n="memories.kicker">Спомени</strong>
              <small data-i18n="memories.desc">Преди време беше на тези събития</small>
            </div>
          </div>
          <div className="evt-memories__list">
            {memories.map(memory => (
              <Link key={memory.eventId} href={`/events/${memory.eventId}`} className="evt-memory">
                {memory.imageUrl ? (
                  <img src={mediaUrl(memory.imageUrl)} alt={memory.title} />
                ) : (
                  <span className="evt-memory__placeholder"><i className="bi bi-calendar-event" /></span>
                )}
                <div className="evt-memory__body">
                  <span className="evt-memory__years">Преди {memory.yearsAgo} {memory.yearsAgo === 1 ? 'година' : 'години'}</span>
                  <strong>{memory.title}</strong>
                  <small>{memory.city} - {format(new Date(memory.eventDate), 'dd.MM.yyyy')}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="evt-stats-grid">
        <div className="evt-stat">
          <span className="evt-stat__icon"><i className="bi bi-calendar-check" /></span>
          <span className="evt-stat__value">{count(profile.eventsAttendedCount)}</span>
          <span className="evt-stat__label" data-i18n="stats.attended">Посетени събития</span>
          {!!profile.monthlyEventsCount && <span className="evt-stat__delta">+{profile.monthlyEventsCount} този месец</span>}
        </div>
        <div className="evt-stat">
          <span className="evt-stat__icon" style={{ background: '#fff3c4', color: '#d97706' }}><i className="bi bi-stars" /></span>
          <span className="evt-stat__value">{count(profile.eventsInterestedCount)}</span>
          <span className="evt-stat__label" data-i18n="stats.interested">Интересува ме</span>
        </div>
        <div className="evt-stat">
          <span className="evt-stat__icon" style={{ background: '#ffe4e0', color: '#c2392c' }}><i className="bi bi-heart-fill" /></span>
          <span className="evt-stat__value">{count(profile.likesGivenCount)}</span>
          <span className="evt-stat__label" data-i18n="stats.likes">Дадени харесвания</span>
        </div>
        <div className="evt-stat">
          <span className="evt-stat__icon" style={{ background: '#dcfce7', color: '#16a34a' }}><i className="bi bi-people-fill" /></span>
          <span className="evt-stat__value">{followersCount}</span>
          <span className="evt-stat__label" data-i18n="stats.followers">Последователи</span>
          {!!profile.monthlyNewFollowersCount && <span className="evt-stat__delta">+{profile.monthlyNewFollowersCount} този месец</span>}
        </div>
        {profile.favouriteGenre && (
          <div className="evt-stat">
            <span className="evt-stat__icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><i className="bi bi-music-note-beamed" /></span>
            <span className="evt-stat__value" style={{ fontSize: '1rem' }}>{profile.favouriteGenre}</span>
            <span className="evt-stat__label" data-i18n="stats.favgenre">Любим жанр</span>
          </div>
        )}
        {!!profile.citiesVisitedCount && (
          <div className="evt-stat">
            <span className="evt-stat__icon" style={{ background: '#cffafe', color: '#0891b2' }}><i className="bi bi-geo-alt-fill" /></span>
            <span className="evt-stat__value">{profile.citiesVisitedCount}</span>
            <span className="evt-stat__label" data-i18n="stats.cities">Града посетени</span>
          </div>
        )}
      </div>

      {!isOrganizer && (
        <>
          <section className="profile-live-grid">
            <article className="profile-live-card profile-live-card--status">
              <span className="groove-kicker">Status</span>
              {profile.profileStatusText ? (
                <>
                  <p className="profile-status-text">
                    <span>{profile.profileStatusEmoji || '♪'}</span>
                    {profile.profileStatusText}
                  </p>
                  {profile.profileStatusUpdatedAt && (
                    <small>{format(new Date(profile.profileStatusUpdatedAt), 'dd.MM HH:mm')} - {profile.profileStatusVisibility}</small>
                  )}
                </>
              ) : (
                <p className="profile-empty-copy">Set a short vibe for people visiting your profile.</p>
              )}
              {profile.canEditProfileStatus && (
                <Link href="/account/edit" className="groove-button groove-button-paper">
                  <i className="bi bi-pencil" /> Update
                </Link>
              )}
            </article>

            <article className="profile-live-card">
              <span className="groove-kicker">Vibe tags</span>
              {profile.vibeTags?.length ? (
                <div className="profile-vibe-tags">
                  {profile.vibeTags.map(tag => <span key={tag}>{tag}</span>)}
                </div>
              ) : (
                <>
                  <p className="profile-empty-copy">Like, save and attend events to shape your music taste here.</p>
                  {isCurrentUser && <Link href="/preferences" className="groove-link">Edit preferences</Link>}
                </>
              )}
            </article>
          </section>

          <section className="groove-page-section profile-tab-section">
            <div className="profile-tabs" role="tablist" aria-label="Profile sections">
              <a href="#profile-overview">Overview</a>
              <a href="#profile-shared">Shared Events</a>
              <a href="#profile-going">Going / Tickets</a>
              {isCurrentUser && <a href="#profile-saved">Saved Events</a>}
              <a href="#profile-following">Following</a>
            </div>
          </section>
        </>
      )}

      {events.length > 0 && (
        <section className="groove-page-section" id="profile-overview">
          <div className="groove-section-bar">
            <div>
              <span className="groove-kicker" data-i18n="profile.events.kicker">Events</span>
              <h2 data-i18n-html="profile.events.title">Upcoming and past <span>events</span>.</h2>
            </div>
          </div>
          <div className="social-card-grid">
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        </section>
      )}

      {!isOrganizer && (
        <>
          <section className="groove-page-section" id="profile-overview">
            <div className="groove-section-bar">
              <div>
                <span className="groove-kicker">Featured event</span>
                <h2>Pinned on this profile.</h2>
              </div>
            </div>
            {pinnedEvent ? (
              <div className="social-card-grid"><EventCard event={pinnedEvent} /></div>
            ) : (
              <EmptyPanel icon="bi-pin-angle" title="No pinned event yet." text="Pin an event from its details page to feature it here." />
            )}
          </section>

          <section className="groove-page-section" id="profile-shared">
            <div className="groove-section-bar">
              <div>
                <span className="groove-kicker">Shared Events</span>
                <h2>Profile-only shares.</h2>
              </div>
            </div>
            {sharedEvents.length ? (
              <div className="social-card-grid">{sharedEvents.map(event => <EventCard key={event.id} event={event} />)}</div>
            ) : (
              <EmptyPanel icon="bi-calendar-heart" title="Още няма споделени събития." text="Shared events stay on the profile and never enter Discover." />
            )}
          </section>

          <section className="groove-page-section" id="profile-going">
            <div className="groove-section-bar">
              <div>
                <span className="groove-kicker">Going / Tickets</span>
                <h2>Plans and recent activity.</h2>
              </div>
              {isCurrentUser && <Link href="/tickets" className="groove-link">My tickets ({count(profile.ticketsCount)})</Link>}
            </div>
            {goingEvents.length ? (
              <div className="social-card-grid">{goingEvents.map(event => <EventCard key={event.id} event={event} />)}</div>
            ) : (
              <EmptyPanel icon="bi-ticket-perforated" title="Все още няма отбелязани събития." text="Mark events as Going to build a livelier profile." />
            )}
          </section>

          {isCurrentUser && (
            <section className="groove-page-section" id="profile-saved">
              <div className="groove-section-bar">
                <div>
                  <span className="groove-kicker">Saved Events</span>
                  <h2>Events you want to keep close.</h2>
                </div>
              </div>
              {savedEvents.length ? (
                <div className="social-card-grid">{savedEvents.map(event => <EventCard key={event.id} event={event} />)}</div>
              ) : (
                <EmptyPanel icon="bi-bookmark" title="Няма запазени събития." text="Запази събитие, за да го видиш тук." />
              )}
            </section>
          )}

          <section className="groove-page-section" id="profile-following">
            <div className="groove-section-bar">
              <div>
                <span className="groove-kicker">Reviews</span>
                <h2>Coming after attended events.</h2>
              </div>
            </div>
            <EmptyPanel icon="bi-chat-quote" title="Все още няма ревюта." text="Reviews are reserved for events with tickets or attendance history." />
          </section>
        </>
      )}

      {isOrganizer && (
        <section className="groove-page-section">
          <div className="groove-section-bar">
            <div>
              <span className="groove-kicker" data-i18n="profile.posts.kicker">Posts</span>
              <h2 data-i18n-html="profile.posts.title">Latest <span>posts</span>.</h2>
            </div>
          </div>
          {posts.length ? (
            <div className="social-post-list">
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          ) : (
            <div className="social-empty-panel">
              <i className="bi bi-journal-text" />
              <span data-i18n="profile.no.posts">No posts yet.</span>
            </div>
          )}
        </section>
      )}
    </section>
  )
}
