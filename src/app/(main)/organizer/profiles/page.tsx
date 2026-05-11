import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { mediaUrl } from '@/lib/media'

interface OrganizerProfile {
  id: number
  displayName: string
  tagline?: string
  city?: string
  avatarImageUrl?: string
  website?: string
  businessWorkspaceId?: number
  workspaceName?: string
  isDefault: boolean
  isApproved: boolean
  eventsCount: number
  postsCount: number
}

async function getProfiles() {
  try {
    const res = await (await authenticatedServerApi()).get<OrganizerProfile[]>('/api/organizer/profiles')
    return res.data
  } catch {
    return []
  }
}

export default async function OrganizerProfilesPage() {
  const profiles = await getProfiles()
  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Организатор</span>
          <h1 className="groove-panel-title">Публични страници</h1>
        </div>
        <div className="groove-page-actions">
          <Link href="/organizer/profiles/edit/new" className="groove-button groove-button-dark"><i className="bi bi-plus-lg" /> Нова</Link>
          <Link href="/organizer/dashboard" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Табло</Link>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="groove-empty-card">
          <i className="bi bi-person-badge" />
          <h2 className="groove-panel-title">Няма публични страници</h2>
          <p className="groove-panel-intro">След одобрение на организаторския акаунт тук ще се показват страниците ти.</p>
        </div>
      ) : (
        <div className="row g-3">
          {profiles.map(profile => (
            <div key={profile.id} className="col-md-6 col-xl-4">
              <article className="groove-paper-card h-100">
                <div className="d-flex align-items-center gap-3">
                  {profile.avatarImageUrl ? (
                    <img src={mediaUrl(profile.avatarImageUrl)} alt={profile.displayName} className="rounded-circle" width={56} height={56} style={{ objectFit: 'cover' }} />
                  ) : (
                    <span className="evt-avatar-circle">{profile.displayName[0]}</span>
                  )}
                  <div>
                    <h2 className="h5 mb-1">{profile.displayName}</h2>
                    <div className="small text-muted">{profile.city}</div>
                    {profile.workspaceName && <div className="small text-muted">Workspace: {profile.workspaceName}</div>}
                  </div>
                </div>
                {profile.tagline && <p className="mt-3 mb-2">{profile.tagline}</p>}
                <div className="d-flex gap-2 flex-wrap mt-3">
                  {profile.isDefault && <span className="badge bg-primary">Основна</span>}
                  {profile.isApproved ? <span className="badge bg-success">Одобрена</span> : <span className="badge bg-warning text-dark">Чака</span>}
                  <span className="badge bg-secondary">{profile.eventsCount} събития</span>
                  <span className="badge bg-secondary">{profile.postsCount} поста</span>
                </div>
                <div className="groove-form-actions mt-3">
                  <Link href={`/pages/${profile.id}`} className="groove-button groove-button-dark groove-button--sm">
                    <i className="bi bi-eye" /> Виж
                  </Link>
                  <Link href={`/organizer/profiles/edit/${profile.id}`} className="groove-button groove-button-paper groove-button--sm">
                    <i className="bi bi-pencil" /> Редакция
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
