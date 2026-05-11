'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function PostDeletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      await api.delete(`/api/posts/${id}`)
      router.push('/flow')
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Публикацията не може да бъде изтрита.')
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-empty-card">
        <i className="bi bi-trash" />
        <h1 className="groove-panel-title">Изтриване на публикация</h1>
        <p className="groove-panel-intro">Сигурен ли си, че искаш да изтриеш тази публикация?</p>
        {error && <div className="auth-zine-validation mt-3" role="alert"><ul><li>{error}</li></ul></div>}
        <div className="groove-form-actions justify-content-center mt-3">
          <button className="groove-button groove-button-dark" type="button" onClick={handleDelete} disabled={loading}>
            <i className="bi bi-trash" /> {loading ? 'Изтриване...' : 'Изтрий'}
          </button>
          <Link href={`/posts/${id}`} className="groove-button groove-button-paper">Отказ</Link>
        </div>
      </div>
    </section>
  )
}
