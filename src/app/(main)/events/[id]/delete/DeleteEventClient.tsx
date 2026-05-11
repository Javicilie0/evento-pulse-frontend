'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export function DeleteEventClient({ id, title }: { id: number; title: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      await api.delete(`/api/events/${id}`)
      router.push('/organizer/events')
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Събитието не може да бъде изтрито.')
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-empty-card">
        <i className="bi bi-trash" />
        <h1 className="groove-panel-title">Изтриване на събитие</h1>
        <p className="groove-panel-intro">Сигурен ли си, че искаш да изтриеш “{title}”?</p>
        {error && <div className="auth-zine-validation mt-3" role="alert"><ul><li>{error}</li></ul></div>}
        <div className="groove-form-actions justify-content-center mt-3">
          <button className="groove-button groove-button-dark" type="button" onClick={handleDelete} disabled={loading}>
            <i className="bi bi-trash" /> {loading ? 'Изтриване...' : 'Изтрий'}
          </button>
          <Link href={`/events/${id}`} className="groove-button groove-button-paper">Отказ</Link>
        </div>
      </div>
    </section>
  )
}
