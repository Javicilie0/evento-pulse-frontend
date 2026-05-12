import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { mediaUrl } from '@/lib/media'

interface FollowProfile {
  id: string
  displayName: string
  profileImageUrl?: string
  isOrganizer?: boolean
  followersCount?: number
  postsCount?: number
  currentUserFollows?: boolean
}

interface FollowList {
  profileId: string
  profileName: string
  listTitle: string
  profiles: FollowProfile[]
}

async function getFollowList(id: string, kind: 'followers' | 'following'): Promise<FollowList> {
  try {
    const res = await (await authenticatedServerApi()).get<FollowList>(`/api/profiles/${id}/${kind}`)
    return res.data
  } catch {
    return {
      profileId: id,
      profileName: 'Профил',
      listTitle: kind === 'followers' ? 'Последователи' : 'Следвани',
      profiles: [],
    }
  }
}

export async function FollowListPage({ id, kind }: { id: string; kind: 'followers' | 'following' }) {
  const data = await getFollowList(id, kind)

  return (
    <section className="groove-app-page social-profile-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">{data.listTitle}</span>
          <h1>{data.profileName}</h1>
        </div>
        <div className="groove-page-actions">
          <Link href={`/profile/${data.profileId}`} className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Back to profile
          </Link>
        </div>
      </div>

      <div className="social-profile-list">
        {data.profiles.length === 0 ? (
          <div className="social-empty-panel">
            <i className="bi bi-people" />
            <span>No profiles here yet.</span>
          </div>
        ) : data.profiles.map(profile => {
          const initial = (profile.displayName?.[0] ?? '?').toUpperCase()
          return (
            <article key={profile.id} className="social-profile-row social-profile-row--large">
              <Link href={`/profile/${profile.id}`} className="social-profile-row__main">
                {profile.profileImageUrl ? (
                  <img src={mediaUrl(profile.profileImageUrl)} alt={profile.displayName} />
                ) : (
                  <span>{initial}</span>
                )}
                <div>
                  <strong>{profile.displayName}</strong>
                  <small>
                    {profile.isOrganizer ? 'Organizer' : 'User'} - {profile.followersCount ?? 0} followers - {profile.postsCount ?? 0} posts
                  </small>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
