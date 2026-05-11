'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Грешен имейл или парола.')
    } else {
      router.push(callbackUrl)
      router.refresh()
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

            <label className="auth-zine-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <span data-i18n="login.remember">Запомни ме</span>
            </label>

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
