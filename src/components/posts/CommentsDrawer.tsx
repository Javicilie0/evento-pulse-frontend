'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { mediaUrl } from '@/lib/media'
import type { PostComment } from '@/types/api'

interface Props {
  postId: number
  initialCount: number
  onClose: () => void
  onCountChange: (delta: number) => void
}

function CommentItem({ comment, postId, onDelete }: { comment: PostComment; postId: number; onDelete: (id: number) => void }) {
  const initial = (comment.userName?.[0] ?? '?').toUpperCase()

  return (
    <article className="groove-comment" style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.4rem' }}>
        {comment.authorImageUrl ? (
          <img src={mediaUrl(comment.authorImageUrl)} alt={comment.userName} className="social-avatar-xs" />
        ) : (
          <span className="social-avatar-xs social-avatar-xs--fallback">{initial}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '0.8rem' }}>{comment.userName}</strong>
            <small className="text-muted" style={{ fontSize: '0.72rem' }}>
              {format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm')}
            </small>
          </div>
          <p style={{ margin: '0.25rem 0 0.4rem', fontSize: '0.9rem' }}>{comment.content}</p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {comment.likesCount > 0 && (
              <span className="small text-muted"><i className="bi bi-heart" /> {comment.likesCount}</span>
            )}
            {comment.canDelete && (
              <button
                className="groove-button groove-button-paper groove-button--sm text-danger"
                type="button"
                onClick={() => onDelete(comment.id)}
              >
                <i className="bi bi-trash" />
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div style={{ paddingLeft: '2.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {comment.replies.map(r => (
            <article key={r.id} className="groove-comment" style={{ fontSize: '0.85rem' }}>
              <strong style={{ fontSize: '0.75rem' }}>{r.userName}</strong>
              <p style={{ margin: '0.2rem 0 0' }}>{r.content}</p>
            </article>
          ))}
        </div>
      )}
    </article>
  )
}

function DrawerInner({ postId, onClose, onCountChange }: Props) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<PostComment[]>(`/api/posts/${postId}/comments`)
      .then(r => setComments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [postId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Focus textarea when opened
  useEffect(() => {
    if (!loading) setTimeout(() => textareaRef.current?.focus(), 100)
  }, [loading])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const res = await api.post<PostComment>(`/api/posts/${postId}/comments`, { content: text })
      setComments(prev => [...prev, res.data])
      setContent('')
      onCountChange(1)
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
      })
    } catch {}
    finally { setSending(false) }
  }

  async function removeComment(id: number) {
    await api.delete(`/api/posts/${postId}/comments/${id}`)
    setComments(prev => prev.filter(c => c.id !== id))
    onCountChange(-1)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1040,
          background: 'rgba(13, 20, 36, 0.45)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(480px, 100vw)',
          zIndex: 1045,
          display: 'flex', flexDirection: 'column',
          background: 'var(--groove-paper, #f5f0e8)',
          borderLeft: '2px solid rgba(36,29,25,0.18)',
          boxShadow: '-8px 0 32px rgba(13,20,36,0.14)',
          animation: 'slideInRight 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '2px dashed rgba(36,29,25,0.18)',
          flexShrink: 0,
        }}>
          <div>
            <div className="groove-kicker" style={{ marginBottom: 0 }}>Коментари</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--groove-ink-muted, #5f6b76)' }}>
              {comments.length} {comments.length === 1 ? 'коментар' : 'коментара'}
            </div>
          </div>
          <button
            type="button"
            className="groove-button groove-button-paper groove-button--sm"
            onClick={onClose}
            aria-label="Затвори"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Comment form */}
        {session && (
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(36,29,25,0.12)', flexShrink: 0 }}>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                ref={textareaRef}
                className="form-control"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={2}
                placeholder="Напиши коментар..."
                maxLength={1000}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e as any)
                }}
                style={{ resize: 'none', fontFamily: 'Lora, Georgia, serif', fontSize: '0.9rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Ctrl+Enter за публикуване</small>
                <button
                  className="groove-button groove-button-dark groove-button--sm"
                  type="submit"
                  disabled={sending || !content.trim()}
                >
                  {sending
                    ? <span className="spinner-border spinner-border-sm" />
                    : <><i className="bi bi-send" /> Публикувай</>
                  }
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Comments list */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
          ) : comments.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-chat-dots" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
              <p>Все още няма коментари.<br />Бъди пръв!</p>
            </div>
          ) : (
            comments.map(c => (
              <CommentItem key={c.id} comment={c} postId={postId} onDelete={removeComment} />
            ))
          )}
        </div>

        {!session && (
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(36,29,25,0.12)', textAlign: 'center' }}>
            <a href="/login" className="groove-button groove-button-dark w-100 justify-content-center">
              <i className="bi bi-box-arrow-in-right" /> Влез за да коментираш
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  )
}

export function CommentsDrawer(props: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(<DrawerInner {...props} />, document.body)
}
