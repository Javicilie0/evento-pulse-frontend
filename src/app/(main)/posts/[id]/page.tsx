import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Post } from '@/types/api'
import { mediaUrl } from '@/lib/media'

interface Props {
  params: Promise<{ id: string }>
}

async function getPost(id: string): Promise<Post | null> {
  try {
    const res = await (await authenticatedServerApi()).get<Post>(`/api/posts/${id}`)
    return res.data
  } catch {
    return null
  }
}

export default async function PostDetailsPage({ params }: Props) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) return notFound()

  return (
    <section className="groove-app-page social-feed-page">
      <div className="groove-page-actions mb-3">
        <Link href="/flow" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> <span>Поток</span>
        </Link>
      </div>

      <article className="groove-paper-card social-post-detail">
        <div className="social-post-card__author">
          <Link href={`/profile/${post.authorId}`} className="social-author-link">
            {post.authorImageUrl ? (
              <img src={mediaUrl(post.authorImageUrl)} alt={post.authorName} className="social-avatar-xs" />
            ) : (
              <span className="social-avatar-xs social-avatar-xs--fallback">{(post.authorName?.[0] ?? '?').toUpperCase()}</span>
            )}
            <span>
              <strong>{post.authorName}</strong>
              <small className="text-muted d-block">{format(new Date(post.createdAt), 'dd.MM.yyyy HH:mm')}</small>
            </span>
          </Link>
        </div>

        {post.mediaUrl && (
          post.mediaType === 'Video'
            ? <video className="w-100 rounded mt-3" controls preload="metadata"><source src={mediaUrl(post.mediaUrl)} /></video>
            : <img src={mediaUrl(post.mediaUrl)} className="w-100 rounded mt-3" alt="Post media" />
        )}

        <p className="mt-3 fs-5">{post.content}</p>

        <div className="social-card-actions">
          <span><i className="bi bi-heart" /> {post.likesCount}</span>
          <span><i className="bi bi-bookmark" /> {post.savesCount}</span>
          <span><i className="bi bi-chat" /> {post.commentsCount}</span>
        </div>
      </article>

      {post.comments && post.comments.length > 0 && (
        <div className="groove-paper-card mt-4">
          <h2 className="groove-panel-title mb-3">Коментари</h2>
          {post.comments.map(comment => (
            <article key={comment.id} className="border-bottom py-3">
              <strong>{comment.userName}</strong>
              <p className="mb-1">{comment.content}</p>
              <small className="text-muted">{format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm')}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
