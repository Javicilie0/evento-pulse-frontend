'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

interface OrganizerApplicationForm {
  organizationName: string
  phoneNumber: string
  country: string
  city: string
  website: string
  companyNumber: string
  referralSource: string
  description: string
}

type ApiError = {
  response?: {
    data?: {
      error?: string
    }
  }
}

const emptyForm: OrganizerApplicationForm = {
  organizationName: '',
  phoneNumber: '',
  country: 'Bulgaria',
  city: '',
  website: '',
  companyNumber: '',
  referralSource: '',
  description: '',
}

export default function EditApplicationPage() {
  const router = useRouter()
  const [form, setForm] = useState<OrganizerApplicationForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.get<Partial<OrganizerApplicationForm>>('/api/auth/organizer-application')
      .then(r => setForm({ ...emptyForm, ...r.data }))
      .catch(() => setError('Кандидатурата не може да бъде заредена.'))
      .finally(() => setLoading(false))
  }, [])

  function set(field: keyof OrganizerApplicationForm, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await api.put('/api/auth/organizer-application', form)
      setSuccess(true)
      router.refresh()
    } catch (err: unknown) {
      const apiError = err as ApiError
      setError(apiError.response?.data?.error || 'Промените не могат да бъдат запазени.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="groove-app-page">
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      </section>
    )
  }

  return (
    <section className="groove-app-page groove-form-shell">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-yellow">Кандидатура</span>
          <h1>Редактирай своята <span>заявка</span>.</h1>
          <p>Промените ще се виждат веднага от администраторите, докато кандидатурата чака преглед.</p>
        </div>
        <div className="groove-page-actions">
          <Link href="/account" className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Към профила
          </Link>
        </div>
      </div>

      <div className="groove-alert groove-alert-warning mb-4">
        <strong>Статус:</strong> кандидатурата все още чака преглед.
      </div>

      <div className="groove-form-panel">
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-zine-validation mb-3" role="alert"><ul><li>{error}</li></ul></div>}
          {success && <div className="alert alert-success">Промените са запазени.</div>}

          <div className="mb-3">
            <label className="form-label">Организация / Сценичен псевдоним</label>
            <input className="form-control" value={form.organizationName} onChange={e => set('organizationName', e.target.value)} required maxLength={200} />
          </div>

          <div className="mb-3">
            <label className="form-label">Описание</label>
            <textarea className="form-control" rows={4} value={form.description} onChange={e => set('description', e.target.value)} maxLength={1000} />
          </div>

          <div className="groove-form-grid">
            <div className="mb-3">
              <label className="form-label">Телефон</label>
              <input className="form-control" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Град</label>
              <input className="form-control" value={form.city} onChange={e => set('city', e.target.value)} required maxLength={100} />
            </div>
          </div>

          <div className="groove-form-grid">
            <div className="mb-3">
              <label className="form-label">Държава</label>
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
            <div className="mb-3">
              <label className="form-label">ЕИК / Фирмен номер</label>
              <input className="form-control" value={form.companyNumber} onChange={e => set('companyNumber', e.target.value)} maxLength={50} />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Уебсайт</label>
            <input className="form-control" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          </div>

          <div className="mb-4">
            <label className="form-label">Как научи за нас?</label>
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

          <div className="groove-form-actions">
            <button type="submit" className="groove-button groove-button-dark" disabled={saving}>
              <i className="bi bi-check-lg" /> {saving ? 'Запазване...' : 'Запази промените'}
            </button>
            <Link href="/account" className="groove-button groove-button-paper">Отказ</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
