'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function CreatePostPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.post('/api/posts', { content })
      router.push('/flow')
    } catch {
      setError('Грешка при публикуването.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker" data-i18n="post.create.kicker">Нова публикация</span>
          <h1 className="groove-panel-title" data-i18n="post.create.title">Сподели нещо.</h1>
        </div>
        <Link href="/flow" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> <span data-i18n="common.back">Назад</span>
        </Link>
      </div>

      <div className="groove-paper-card">
        <form onSubmit={handleSubmit} className="auth-zine-form">
          {error && (
            <div className="auth-zine-validation" role="alert">
              <ul><li>{error}</li></ul>
            </div>
          )}
          <div className="auth-zine-field">
            <label htmlFor="content" data-i18n="post.content.label">Текст</label>
            <textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              placeholder="Сподели новина, събитие или мисъл..."
              data-i18n-placeholder="post.content.placeholder"
              maxLength={2000}
              required
              style={{ resize: 'vertical' }}
            />
          </div>
          <button type="submit" className="auth-zine-button auth-zine-button-teal" disabled={loading}>
            <i className="bi bi-send" />
            {' '}
            <span data-i18n="post.publish">{loading ? 'Публикуване...' : 'Публикувай'}</span>
          </button>
        </form>
      </div>
    </section>
  )
}
