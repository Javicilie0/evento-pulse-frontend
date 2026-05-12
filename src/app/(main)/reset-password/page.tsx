'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get('r') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Паролите не съвпадат.')
      return
    }
    if (!requestId) {
      setError('Невалиден линк. Провери дали си копирал целия URL.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, newPassword: password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Грешка. Опитай отново.')
      } else {
        setMessage(data?.message ?? 'Паролата е сменена успешно.')
      }
    } catch {
      setError('Мрежова грешка. Опитай отново.')
    } finally {
      setLoading(false)
    }
  }

  if (!requestId) {
    return (
      <div className="auth-zine-validation" role="alert">
        <ul><li>Невалиден линк. Поискай нов от страницата за забравена парола.</li></ul>
        <Link href="/forgot-password" className="auth-zine-button auth-zine-button-red" style={{ display: 'inline-flex', marginTop: '0.75rem' }}>
          <i className="bi bi-envelope" /> Забравена парола
        </Link>
      </div>
    )
  }

  return (
    <>
      {message ? (
        <div
          className="auth-zine-validation"
          role="alert"
          style={{ background: 'var(--bs-success-bg-subtle)', borderColor: 'var(--bs-success)' }}
        >
          <p><i className="bi bi-check-circle" /> {message}</p>
          <Link href="/login" className="auth-zine-button auth-zine-button-teal" style={{ display: 'inline-flex', marginTop: '0.75rem' }}>
            <i className="bi bi-box-arrow-in-right" /> Вход
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-zine-form">
          {error && (
            <div className="auth-zine-validation" role="alert">
              <ul><li>{error}</li></ul>
            </div>
          )}

          <div className="auth-zine-field">
            <label htmlFor="password">Нова парола</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="поне 5 символа"
              required
              minLength={5}
            />
          </div>

          <div className="auth-zine-field">
            <label htmlFor="confirm">Потвърди паролата</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="повтори паролата"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-zine-button auth-zine-button-red"
            disabled={loading}
          >
            <i className="bi bi-shield-check" />
            {' '}
            {loading ? 'Записване...' : 'Смени паролата'}
          </button>
        </form>
      )}
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <section className="auth-zine-page">
      <div className="auth-zine-shell">
        <div className="auth-zine-copy">
          <span className="auth-zine-stamp auth-zine-stamp-teal">Парола</span>
          <h1>Нова парола</h1>
          <p>Въведи новата си парола. Линкът е валиден 2 часа.</p>
        </div>

        <div className="auth-zine-card">
          <Suspense fallback={<div style={{ minHeight: 120 }} />}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="auth-zine-alt">
          <Link href="/login">Обратно към Вход</Link>
        </p>
      </div>
    </section>
  )
}
