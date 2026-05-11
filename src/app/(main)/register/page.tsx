'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userName: '',
    registerAsOrganizer: false,
    organizationName: '',
    phoneNumber: '',
    country: 'Bulgaria',
    city: '',
    website: '',
    companyNumber: '',
    referralSource: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'radio' ? value === 'true' : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Възникна грешка.')
        return
      }

      if (data.message) {
        setMessage(data.message)
        return
      }

      await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      router.push('/')
      router.refresh()
    } catch {
      setError('Не може да се свърже с сървъра.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-zine-page">
      <div className="auth-zine-shell auth-zine-shell-wide">
        <div className="auth-zine-copy">
          <span className="auth-zine-stamp auth-zine-stamp-red" data-i18n="register.stamp">Нов профил</span>
          <h1 data-i18n-html="register.h1">
            Започни своя <span>дневник</span>.
          </h1>
          <p data-i18n="register.p">
            Създай Evento акаунт, за да запазваш вечери, да купуваш билети и да следиш любимите си организатори.
          </p>
        </div>

        <div className="auth-zine-card">
          {message ? (
            <div className="auth-zine-validation" role="alert" style={{ background: 'var(--bs-success-bg-subtle)', borderColor: 'var(--bs-success)' }}>
              <p>{message}</p>
              <Link href="/login" className="auth-zine-button auth-zine-button-teal" style={{ display: 'inline-flex' }}>
                <i className="bi bi-box-arrow-in-right" /> Вход
              </Link>
            </div>
          ) : (
            <form id="registerForm" onSubmit={handleSubmit} className="auth-zine-form">
              {error && (
                <div className="auth-zine-validation" role="alert">
                  <ul><li>{error}</li></ul>
                </div>
              )}

              <div className="register-account-switch" data-register-switch>
                <label className="register-account-option">
                  <input
                    type="radio"
                    name="registerAsOrganizer"
                    value="false"
                    checked={!form.registerAsOrganizer}
                    onChange={handleChange}
                  />
                  <span>
                    <strong>Личен акаунт</strong>
                    <small>Купуваш билети, следиш събития и организатори.</small>
                  </span>
                </label>
                <label className="register-account-option register-account-option--organizer">
                  <input
                    type="radio"
                    name="registerAsOrganizer"
                    value="true"
                    checked={form.registerAsOrganizer}
                    onChange={handleChange}
                  />
                  <span>
                    <strong>Аз съм организатор, продуцент или място за събития</strong>
                    <small>Продавам билети и управлявам събития през Evento.</small>
                  </span>
                </label>
              </div>

              <div className="auth-zine-grid">
                <div className="auth-zine-field">
                  <label htmlFor="firstName" data-i18n="register.firstname.label">Ime</label>
                  <input
                    id="firstName"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    placeholder="Иван"
                    data-i18n-placeholder="register.firstname.placeholder"
                  />
                </div>
                <div className="auth-zine-field">
                  <label htmlFor="lastName" data-i18n="register.lastname.label">Фамилия</label>
                  <input
                    id="lastName"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    placeholder="Георгиев"
                    data-i18n-placeholder="register.lastname.placeholder"
                  />
                </div>
              </div>

              <div className="auth-zine-field">
                <label htmlFor="userName" data-i18n="register.username.label">Потребителско име</label>
                <input
                  id="userName"
                  name="userName"
                  value={form.userName}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="ivan.georgiev"
                />
              </div>

              <div className="auth-zine-field">
                <label htmlFor="email">Имейл / служебна e-поща</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="georgiev@example.com"
                  required
                />
              </div>

              <div className="auth-zine-grid">
                <div className="auth-zine-field">
                  <label htmlFor="password" data-i18n="register.password.label">Парола</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="поне 5 символа"
                    data-i18n-placeholder="register.password.placeholder"
                    required
                  />
                </div>
                <div className="auth-zine-field">
                  <label htmlFor="confirmPassword" data-i18n="register.confirm.label">Потвърди парола</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="повтори паролата"
                    data-i18n-placeholder="register.confirm.placeholder"
                    required
                  />
                </div>
              </div>

              {form.registerAsOrganizer && (
                <div className="register-organizer-panel">
                  <div className="register-organizer-panel__head">
                    <i className="bi bi-rocket-takeoff" />
                    <div>
                      <h2>Добре, нека започнем с основното.</h2>
                      <p>Тези данни създават заявка за организатор. След регистрацията ще можеш да я довършиш и редактираш.</p>
                    </div>
                  </div>

                  <div className="auth-zine-field">
                    <label htmlFor="organizationName">Организация</label>
                    <input
                      id="organizationName"
                      name="organizationName"
                      value={form.organizationName}
                      onChange={handleChange}
                      autoComplete="organization"
                      placeholder="Ime на клуб, театър, промоутър..."
                    />
                  </div>

                  <div className="auth-zine-grid">
                    <div className="auth-zine-field">
                      <label htmlFor="phoneNumber">Телефон</label>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        autoComplete="tel"
                        placeholder="+359 88 123 4567"
                      />
                    </div>
                    <div className="auth-zine-field">
                      <label htmlFor="country">Държава</label>
                      <select
                        id="country"
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="auth-zine-select"
                      >
                        <option value="Bulgaria">Bulgaria</option>
                        <option value="Romania">Romania</option>
                        <option value="Greece">Greece</option>
                        <option value="Serbia">Serbia</option>
                        <option value="North Macedonia">North Macedonia</option>
                        <option value="Turkey">Turkey</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="auth-zine-grid">
                    <div className="auth-zine-field">
                      <label htmlFor="city">Град</label>
                      <input
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        autoComplete="address-level2"
                        placeholder="София"
                      />
                    </div>
                    <div className="auth-zine-field">
                      <label htmlFor="referralSource">Откъде ни намери</label>
                      <select
                        id="referralSource"
                        name="referralSource"
                        value={form.referralSource}
                        onChange={handleChange}
                        className="auth-zine-select"
                      >
                        <option value="">Избери</option>
                        <option value="Google">Google</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Friend">Препоръка</option>
                        <option value="Event">От събитие</option>
                        <option value="Other">Друго</option>
                      </select>
                    </div>
                  </div>

                  <div className="auth-zine-grid">
                    <div className="auth-zine-field">
                      <label htmlFor="website">Уебсайт</label>
                      <input
                        id="website"
                        name="website"
                        value={form.website}
                        onChange={handleChange}
                        autoComplete="url"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="auth-zine-field">
                      <label htmlFor="companyNumber">ЕИК / фирмен номер</label>
                      <input
                        id="companyNumber"
                        name="companyNumber"
                        value={form.companyNumber}
                        onChange={handleChange}
                        placeholder="ЕИК / фирмен номер"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                id="registerSubmit"
                type="submit"
                className="auth-zine-button auth-zine-button-teal"
                disabled={loading}
              >
                <i className="bi bi-person-plus" />
                {' '}
                <span>
                  {loading
                    ? 'Регистрация...'
                    : form.registerAsOrganizer
                      ? 'Регистрация като организатор'
                      : 'Създай акаунт'}
                </span>
              </button>
            </form>
          )}
        </div>

        <p className="auth-zine-alt">
          <span data-i18n="register.hasaccount">Вече имаш профил?</span>
          {' '}
          <Link href="/login" data-i18n="register.loginlink">Вход</Link>
        </p>
      </div>
    </section>
  )
}
