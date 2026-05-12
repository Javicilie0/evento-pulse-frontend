'use client'

import { useState } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Грешка. Опитай отново.')
      } else {
        setMessage(data?.message ?? 'Ако имейлът е регистриран, ще получиш линк за смяна на парола.')
      }
    } catch {
      setError('Мрежова грешка. Опитай отново.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-zine-page">
      <div className="auth-zine-shell">
        <div className="auth-zine-copy">
          <span className="auth-zine-stamp auth-zine-stamp-teal">Парола</span>
          <h1>Забравена парола</h1>
          <p>Въведи имейла си и ще ти изпратим линк за смяна на паролата.</p>
        </div>

        <div className="auth-zine-card">
          {message ? (
            <div
              className="auth-zine-validation"
              role="alert"
              style={{ background: 'var(--bs-success-bg-subtle)', borderColor: 'var(--bs-success)' }}
            >
              <p><i className="bi bi-envelope-check" /> {message}</p>
              <Link href="/login" className="auth-zine-button auth-zine-button-teal" style={{ display: 'inline-flex', marginTop: '0.75rem' }}>
                <i className="bi bi-box-arrow-in-right" /> Обратно към Вход
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
                <label htmlFor="email">Имейл</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-zine-button auth-zine-button-red"
                disabled={loading}
              >
                <i className="bi bi-envelope" />
                {' '}
                {loading ? 'Изпращане...' : 'Изпрати линк'}
              </button>
            </form>
          )}
        </div>

        <p className="auth-zine-alt">
          <Link href="/login">Обратно към Вход</Link>
        </p>
      </div>
    </section>
  )
}
