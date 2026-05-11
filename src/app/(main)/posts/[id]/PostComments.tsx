'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import type { PostComment } from '@/types/api'

export function PostComments({ postId, initialComments }: { postId: number; initialComments: PostComment[] }) {
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      const res = await api.post<PostComment>(`/api/posts/${postId}/comments`, { content })
      setComments(prev => [res.data, ...prev])
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  async function remove(commentId: number) {
    await api.delete(`/api/posts/${postId}/comments/${commentId}`)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  return (
    <div className="groove-paper-card mt-4">
      <h2 className="groove-panel-title mb-3">Коментари</h2>
      <form className="social-add-comment mb-3" onSubmit={submit}>
        <div className="input-group">
          <input className="form-control" value={content} onChange={e => setContent(e.target.value)} placeholder="Напиши коментар..." maxLength={1000} />
          <button className="btn btn-primary" disabled={loading}><i className="bi bi-send" /></button>
        </div>
      </form>
      {comments.length === 0 ? (
        <p className="text-muted mb-0">Все още няма коментари.</p>
      ) : comments.map(comment => (
        <article key={comment.id} className="border-bottom py-3">
          <div className="d-flex justify-content-between gap-2">
            <div>
              <strong>{comment.userName}</strong>
              <p className="mb-1">{comment.content}</p>
            </div>
            {comment.canDelete && (
              <button className="groove-button groove-button-paper groove-button--sm" type="button" onClick={() => remove(comment.id)}>
                <i className="bi bi-trash" />
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
