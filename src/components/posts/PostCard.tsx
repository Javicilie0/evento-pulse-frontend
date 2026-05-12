'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { getSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { mediaUrl } from '@/lib/media'
import { getFeedConnection } from '@/lib/feedHub'
import { CommentsDrawer } from './CommentsDrawer'
import type { Post } from '@/types/api'

interface Props {
  post: Post
}

export function PostCard({ post }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const isAuthed = !!session

  const [likes, setLikes] = useState(post.likesCount)
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [saves, setSaves] = useState(post.savesCount)
  const [isSaved, setIsSaved] = useState(post.isSaved)
  const [comments, setComments] = useState(post.commentsCount)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    let joined = false
    getFeedConnection(() => getSession().then(s => (s as any)?.accessToken ?? null))
      .then(conn => {
        conn.on('PostLiked', (data: { postId: number; likesCount: number }) => {
          if (data.postId === post.id) setLikes(data.likesCount)
        })
        conn.invoke('JoinPost', post.id).then(() => { joined = true }).catch(() => {})
      })
      .catch(() => {})
    return () => {
      if (joined) {
        getFeedConnection(() => getSession().then(s => (s as any)?.accessToken ?? null))
          .then(conn => conn.invoke('LeavePost', post.id).catch(() => {}))
          .catch(() => {})
      }
    }
  }, [post.id])

  const preview = post.content.length > 220 ? post.content.slice(0, 220) + '...' : post.content
  const initial = (post.authorName?.[0] ?? '?').toUpperCase()
  const authorHref = post.organizerProfileId ? `/pages/${post.organizerProfileId}` : `/profile/${post.authorId}`

  async function handleLike() {
    if (!isAuthed) return router.push('/login')
    try {
      if (isLiked) {
        const r = await api.post(`/api/posts/${post.id}/unlike`)
        setLikes(r.data.likesCount); setIsLiked(false)
      } else {
        const r = await api.post(`/api/posts/${post.id}/like`)
        setLikes(r.data.likesCount); setIsLiked(true)
      }
    } catch {}
  }

  async function handleSave() {
    if (!isAuthed) return router.push('/login')
    try {
      if (isSaved) {
        await api.post(`/api/posts/${post.id}/unsave`); setSaves(s => s - 1); setIsSaved(false)
      } else {
        await api.post(`/api/posts/${post.id}/save`); setSaves(s => s + 1); setIsSaved(true)
      }
    } catch {}
  }

  function openComments() {
    if (!isAuthed) return router.push('/login')
    setDrawerOpen(true)
  }

  return (
    <>
      <div className="card h-100 shadow-sm post-card social-post-card" data-post-card data-post-id={post.id}>
        {post.mediaUrl && (
          post.mediaType === 'Video' ? (
            <video className="card-img-top card-img-top-fixed bg-dark" controls preload="metadata" muted>
              <source src={mediaUrl(post.mediaUrl)} />
            </video>
          ) : (
            <img src={mediaUrl(post.mediaUrl)} className="card-img-top card-img-top-fixed" alt="Post media" />
          )
        )}

        <div className="card-body d-flex flex-column">
          <div className="social-post-card__author">
            <Link href={authorHref} className="social-author-link">
              {post.authorImageUrl ? (
                <img src={mediaUrl(post.authorImageUrl)} alt={post.authorName} className="social-avatar-xs" />
              ) : (
                <span className="social-avatar-xs social-avatar-xs--fallback">{initial}</span>
              )}
              <span>
                <strong>{post.authorName}</strong>
              </span>
            </Link>
            <small className="text-muted">{format(new Date(post.createdAt), 'dd.MM.yyyy HH:mm')}</small>
          </div>

          <p className="card-text post-body flex-grow-1">{preview}</p>

          <div className="social-card-actions mt-auto">
            <div className="social-card-actions__primary">
              {isAuthed ? (
                <>
                  <button
                    className={`btn btn-sm ${isLiked ? 'btn-danger' : 'btn-outline-danger'}`}
                    type="button"
                    onClick={handleLike}
                    title="Like"
                  >
                    <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`} /> {likes}
                  </button>
                  <button
                    className={`btn btn-sm ${isSaved ? 'btn-dark' : 'btn-outline-dark'}`}
                    type="button"
                    onClick={handleSave}
                    title="Save"
                  >
                    <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`} /> {saves}
                  </button>
                </>
              ) : (
                <>
                  <span className="small text-muted"><i className="bi bi-heart" /> {likes}</span>
                  <span className="small text-muted"><i className="bi bi-bookmark" /> {saves}</span>
                </>
              )}

              {/* Comments button — opens drawer instead of navigating */}
              <button
                className={`btn btn-sm btn-outline-secondary ${drawerOpen ? 'active' : ''}`}
                type="button"
                onClick={openComments}
                title="Коментари"
              >
                <i className="bi bi-chat" /> <span>{comments}</span>
              </button>

              <Link href={`/posts/${post.id}`} className="btn btn-sm btn-outline-primary" title="Виж публикацията">
                <i className="bi bi-arrow-up-right" />
              </Link>
            </div>

            {(post.canEdit || post.canDelete) && (
              <div className="social-card-actions__manage">
                {post.canEdit && (
                  <Link href={`/posts/${post.id}/edit`} className="btn btn-sm btn-outline-secondary" title="Edit">
                    <i className="bi bi-pencil" />
                  </Link>
                )}
                {post.canDelete && (
                  <Link href={`/posts/${post.id}/delete`} className="btn btn-sm btn-outline-danger" title="Delete">
                    <i className="bi bi-trash" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <CommentsDrawer
          postId={post.id}
          initialCount={comments}
          onClose={() => setDrawerOpen(false)}
          onCountChange={delta => setComments(c => c + delta)}
        />
      )}
    </>
  )
}
