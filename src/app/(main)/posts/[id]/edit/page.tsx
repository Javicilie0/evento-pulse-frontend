'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Post } from '@/types/api'

export default function PostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Post>(`/api/posts/${id}`)
      .then(r => setContent(r.data.content))
      .catch(() => setError('Публикацията не може да бъде заредена.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.put(`/api/posts/${id}`, { content })
      router.push(`/posts/${id}`)
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Публикацията не може да бъде запазена.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Поток</span>
          <h1 className="groove-panel-title">Редакция на публикация</h1>
        </div>
        <Link href={`/posts/${id}`} className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> Назад
        </Link>
      </div>

      <div className="groove-paper-card">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-zine-form">
            {error && <div className="auth-zine-validation" role="alert"><ul><li>{error}</li></ul></div>}
            <div className="auth-zine-field">
              <label htmlFor="content">Текст</label>
              <textarea id="content" className="form-control" rows={8} value={content} onChange={e => setContent(e.target.value)} required maxLength={3000} />
            </div>
            <div className="groove-form-actions mt-4">
              <button className="auth-zine-button auth-zine-button-red" type="submit" disabled={saving}>
                <i className="bi bi-check2" /> {saving ? 'Запазване...' : 'Запази'}
              </button>
              <Link href={`/posts/${id}`} className="groove-button groove-button-paper">Отказ</Link>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
