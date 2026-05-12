'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function ApplyOrganizerPage() {
  const { status } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({
    organizationName: '',
    phoneNumber: '',
    country: 'Bulgaria',
    city: '',
    website: '',
    companyNumber: '',
    referralSource: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/apply-organizer', form)
      setSuccess(true)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } }
      setError(apiError.response?.data?.error || 'Грешка при кандидатстването.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <section className="groove-app-page">
        <div className="groove-empty-card mt-4">
          <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }} />
          <h2 className="groove-panel-title mt-3">Заявката е изпратена!</h2>
          <p className="groove-panel-intro">Администраторът ще прегледа заявката ти скоро.</p>
          <Link href="/account" className="groove-button groove-button-dark mt-3"><i className="bi bi-person-circle" /> Към профила</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Организатор</span>
          <h1>Кандидатствай за <span>организатор</span>.</h1>
          <p className="groove-page-hero__lead">Попълни формата и ние ще разгледаме заявката ти.</p>
        </div>
        <Link href="/account" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>
      </div>

      <div className="groove-paper-card mt-4">
        <form onSubmit={handleSubmit} className="auth-zine-form">
          {error && (
            <div className="auth-zine-validation" role="alert"><ul><li>{error}</li></ul></div>
          )}

          <div className="row g-3">
            <div className="col-12">
              <div className="auth-zine-field">
                <label>Име на организация / място *</label>
                <input type="text" className="form-control" value={form.organizationName}
                  onChange={e => set('organizationName', e.target.value)} required maxLength={200} placeholder="напр. Sound Factory Events" />
              </div>
            </div>
            <div className="col-12">
              <div className="auth-zine-field">
                <label>Описание</label>
                <textarea className="form-control" rows={4} value={form.description}
                  onChange={e => set('description', e.target.value)} maxLength={1000}
                  placeholder="Опиши организацията си и какви събития организираш..."
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label>Телефон</label>
                <input type="tel" className="form-control" value={form.phoneNumber}
                  onChange={e => set('phoneNumber', e.target.value)} placeholder="+359 88 123 4567" />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label>Град</label>
                <input type="text" className="form-control" value={form.city}
                  onChange={e => set('city', e.target.value)} maxLength={100} placeholder="София" />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label>Държава</label>
                <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)}>
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
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label>Уебсайт</label>
                <input type="url" className="form-control" value={form.website}
                  onChange={e => set('website', e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label>ЕИК / Фирмен номер</label>
                <input type="text" className="form-control" value={form.companyNumber}
                  onChange={e => set('companyNumber', e.target.value)} maxLength={50} placeholder="123456789" />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label>Как научи за нас?</label>
                <select className="form-select" value={form.referralSource} onChange={e => set('referralSource', e.target.value)}>
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
          </div>

          <div className="alert alert-info small mt-4 mb-0">
            <i className="bi bi-info-circle" /> С изпращането на тази заявка се съгласяваш данните за организацията да бъдат прегледани от нашия екип.
            Само полето <strong>Име на организацията</strong> е задължително, а всички останали са по избор.
          </div>

          <div className="groove-form-actions mt-4">
            <button type="submit" className="auth-zine-button auth-zine-button-teal" disabled={loading}>
              <i className="bi bi-send" /> {loading ? 'Изпращане...' : 'Изпрати заявката'}
            </button>
            <Link href="/account" className="groove-button groove-button-paper">Отказ</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
