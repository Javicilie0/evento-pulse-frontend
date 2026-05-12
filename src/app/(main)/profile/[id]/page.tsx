import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { AuthUser, UserProfile } from '@/types/api'
import { mediaUrl } from '@/lib/media'
import { ProfileActions } from './ProfileActions'

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

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const profile = await getProfile(id)
  if (!profile) return notFound()

  const initial = (profile.firstName?.[0] ?? profile.userName?.[0] ?? '?').toUpperCase()
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.userName

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
          <h1>{displayName}</h1>
          <p className="social-profile-username text-muted">@{profile.userName}</p>
          {profile.bio && <p>{profile.bio}</p>}

          <div className="social-profile-stats">
            <Link href={`/profile/${profile.id}/followers`}>
              <strong>{profile.followerCount}</strong>
              <span data-i18n="profile.followers"> последователи</span>
            </Link>
            <Link href={`/profile/${profile.id}/following`}>
              <strong>{profile.followingCount}</strong>
              <span data-i18n="profile.following"> следвани</span>
            </Link>
          </div>

          {!profile.isOwnProfile && (
            <ProfileActions profileId={profile.id} initialIsFollowing={profile.isFollowing} initialFollowerCount={profile.followerCount} />
          )}

          {profile.isOwnProfile && (
            <div className="groove-cta-row mt-3">
              <Link href="/account" className="groove-button groove-button-paper">
                <i className="bi bi-pencil" /> <span data-i18n="account.edit">Редактирай профила</span>
              </Link>
            </div>
          )}
        </div>
      </article>
    </section>
  )
}
