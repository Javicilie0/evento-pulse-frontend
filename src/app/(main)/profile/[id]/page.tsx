import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { UserProfile } from '@/types/api'
import { mediaUrl } from '@/lib/media'
import { ProfileActions } from './ProfileActions'

interface Props {
  params: Promise<{ id: string }>
}

async function getProfile(id: string): Promise<UserProfile | null> {
  try {
    const res = await (await authenticatedServerApi()).get<UserProfile>(`/api/profiles/${id}`)
    return res.data
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
            <span>
              <strong>{profile.followerCount}</strong>
              <span data-i18n="profile.followers"> последователи</span>
            </span>
            <span>
              <strong>{profile.followingCount}</strong>
              <span data-i18n="profile.following"> следвани</span>
            </span>
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
