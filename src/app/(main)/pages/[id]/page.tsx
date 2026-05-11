import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { mediaUrl } from '@/lib/media'

interface OrganizerPage {
  id: number
  displayName: string
  tagline?: string
  description?: string
  city?: string
  avatarImageUrl?: string
  coverImageUrl?: string
  website?: string
  contactEmail?: string
  instagramUrl?: string
  facebookUrl?: string
  tikTokUrl?: string
  brandColor?: string
  workspaceName?: string
  events: Array<{ id: number; title: string; city: string; startTime: string; imageUrl?: string; genre: string }>
  posts: Array<{ id: number; content: string; createdAt: string; mediaUrl?: string; likesCount: number; commentsCount: number }>
}

async function getPage(id: string) {
  try {
    const res = await (await authenticatedServerApi()).get<OrganizerPage>(`/api/organizer-pages/${id}`)
    return res.data
  } catch {
    return null
  }
}

export default async function PublicOrganizerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = await getPage(id)
  if (!page) return notFound()

  return (
    <section className="groove-app-page">
      <article className="social-profile-hero" style={{ borderTop: `6px solid ${page.brandColor || '#2456ff'}` }}>
        {page.coverImageUrl && <img src={mediaUrl(page.coverImageUrl)} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 8 }} />}
        <div className="social-profile-hero__avatar">
          {page.avatarImageUrl ? <img src={mediaUrl(page.avatarImageUrl)} alt={page.displayName} /> : <span className="evt-avatar-circle">{page.displayName[0]}</span>}
        </div>
        <div className="social-profile-hero__body">
          <h1>{page.displayName}</h1>
          {page.tagline && <p className="social-profile-username text-muted">{page.tagline}</p>}
          {page.description && <p>{page.description}</p>}
          <div className="groove-cta-row mt-3">
            {page.website && <a className="groove-button groove-button-paper" href={page.website} target="_blank">Сайт</a>}
            {page.contactEmail && <a className="groove-button groove-button-dark" href={`mailto:${page.contactEmail}`}>Контакт</a>}
          </div>
        </div>
      </article>

      <section className="groove-page-section">
        <div className="groove-section-bar"><div><span className="groove-kicker">Събития</span><h2>Предстоящи</h2></div></div>
        <div className="row g-3">{page.events.map(ev => <div key={ev.id} className="col-md-4"><Link href={`/events/${ev.id}`} className="evt-trending__row"><span className="evt-trending__body"><strong>{ev.title}</strong><small>{ev.city} · {format(new Date(ev.startTime), 'dd.MM HH:mm')}</small></span></Link></div>)}</div>
      </section>

      <section className="groove-page-section">
        <div className="groove-section-bar"><div><span className="groove-kicker">Публикации</span><h2>Последни новини</h2></div></div>
        <div className="row g-3">{page.posts.map(post => <div key={post.id} className="col-md-6"><Link href={`/posts/${post.id}`} className="groove-paper-card d-block text-decoration-none"><p>{post.content}</p><small>{format(new Date(post.createdAt), 'dd.MM.yyyy')}</small></Link></div>)}</div>
      </section>
    </section>
  )
}
