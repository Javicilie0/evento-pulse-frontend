'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNeedsConfirmation(false)
    setLoading(true)

    try {
      const checkRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!checkRes.ok) {
        const body = await checkRes.json().catch(() => ({}))
        const msg: string = body?.error ?? 'Грешен имейл или парола.'
        setError(msg)
        if (msg.toLowerCase().includes('потвърди')) setNeedsConfirmation(true)
        return
      }

      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Грешен имейл или парола.')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Мрежова грешка. Опитай отново.')
    } finally {
      setLoading(false)
    }
  }

  async function resendConfirmation() {
    setResendLoading(true)
    try {
      await fetch(`${API_URL}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendDone(true)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <section className="auth-zine-page">
      <div className="auth-zine-shell">
        <div className="auth-zine-copy">
          <span className="auth-zine-stamp auth-zine-stamp-teal" data-i18n="login.stamp">Вход</span>
          <h1 data-i18n-html="login.h1">Вход</h1>
          <p data-i18n="login.p">
            Добре дошъл отново в Evento. Влез, за да следиш събития, билети и любимите си сцени.
          </p>
        </div>

        <div className="auth-zine-card">
          <form id="account" onSubmit={handleSubmit} className="auth-zine-form">
            {error && (
              <div className="auth-zine-validation" role="alert">
                <ul><li>{error}</li></ul>
                {needsConfirmation && !resendDone && (
                  <button
                    type="button"
                    className="auth-zine-button auth-zine-button-red"
                    style={{ marginTop: '0.5rem', width: '100%' }}
                    disabled={resendLoading}
                    onClick={resendConfirmation}
                  >
                    {resendLoading
                      ? <span className="spinner-border spinner-border-sm" />
                      : <><i className="bi bi-envelope" /> Изпрати нов линк</>}
                  </button>
                )}
                {resendDone && (
                  <p style={{ marginTop: '0.5rem', color: '#16a34a', fontSize: '0.85rem' }}>
                    <i className="bi bi-check-circle" /> Изпратихме нов линк за потвърждение.
                  </p>
                )}
              </div>
            )}

            <div className="auth-zine-field">
              <label htmlFor="email" data-i18n="login.email.label">Имейл или потребителско име</label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@evento.app или username"
                data-i18n-placeholder="login.email.placeholder"
                required
              />
            </div>

            <div className="auth-zine-field">
              <label htmlFor="password" data-i18n="login.password.label">Парола</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="парола"
                data-i18n-placeholder="login.password.placeholder"
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="auth-zine-button auth-zine-button-red"
              disabled={loading}
            >
              <i className="bi bi-box-arrow-in-right" />
              {' '}
              <span data-i18n="login.btn">{loading ? 'Влизане...' : 'Вход'}</span>
            </button>

            <p className="auth-zine-alt auth-zine-alt--inside">
              <Link href="/forgot-password">Забравена парола?</Link>
            </p>
          </form>
        </div>

        <p className="auth-zine-alt">
          <span data-i18n="login.noaccount">Нямаш профил?</span>
          {' '}
          <Link href={`/register${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} data-i18n="login.createaccount">
            Създай акаунт
          </Link>
        </p>
      </div>
    </section>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <section className="auth-zine-page">
        <div className="auth-zine-shell">
          <div className="auth-zine-card" style={{ minHeight: 200 }} />
        </div>
      </section>
    }>
      <LoginForm />
    </Suspense>
  )
}
