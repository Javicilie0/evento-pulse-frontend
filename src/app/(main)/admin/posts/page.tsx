'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface AdminPost {
  id: number
  content: string
  authorName: string
  likesCount: number
  commentsCount: number
  createdAt: string
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => {
    api.get<AdminPost[]>('/api/admin/posts')
      .then(r => setPosts(r.data))
      .finally(() => setLoading(false))
  }, [])

  async function deletePost(id: number) {
    if (!confirm('Да изтрия ли тази публикация?')) return
    setActionId(id)
    try {
      await api.delete(`/api/admin/posts/${id}`)
      setPosts(prev => prev.filter(p => p.id !== id))
    } finally {
      setActionId(null)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Администратор</span>
          <h1 className="groove-panel-title">Публикации</h1>
        </div>
        <Link href="/admin" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>
      </div>

      <div className="groove-paper-card">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover groove-table">
              <thead>
                <tr>
                  <th>Публикация</th>
                  <th>Автор</th>
                  <th>Дата</th>
                  <th>Реакции</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id}>
                    <td style={{ maxWidth: 420 }}>{post.content}</td>
                    <td>{post.authorName}</td>
                    <td>{format(new Date(post.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                    <td><i className="bi bi-heart" /> {post.likesCount} <i className="bi bi-chat ms-2" /> {post.commentsCount}</td>
                    <td className="d-flex gap-2">
                      <Link href={`/posts/${post.id}`} className="groove-button groove-button-paper groove-button--sm">Виж</Link>
                      <button className="groove-button groove-button-paper groove-button--sm text-danger" onClick={() => deletePost(post.id)} disabled={actionId === post.id}>
                        {actionId === post.id ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-trash" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
