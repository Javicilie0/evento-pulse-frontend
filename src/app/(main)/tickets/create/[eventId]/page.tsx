'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function CreateTicketPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '0',
    quantityTotal: '100',
    imageUrl: '',
    isActive: true,
    requiresAttendeeNames: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post(`/api/tickets/event/${eventId}`, {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        quantityTotal: Number(form.quantityTotal),
        imageUrl: form.imageUrl || undefined,
        isActive: form.isActive,
        requiresAttendeeNames: form.requiresAttendeeNames,
      })
      router.push(`/tickets/manage/${eventId}`)
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Билетът не може да бъде създаден.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-red">Организатор</span>
          <h1>Нов <span>билет</span>.</h1>
          <p className="groove-page-hero__lead">Добави тип билет към събитието.</p>
        </div>
        <div className="groove-page-actions">
          <Link href={`/tickets/manage/${eventId}`} className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Назад
          </Link>
        </div>
      </div>

      <div className="groove-paper-card mt-4">
        <form onSubmit={handleSubmit} className="auth-zine-form">
          {error && <div className="auth-zine-validation" role="alert"><ul><li>{error}</li></ul></div>}
          <div className="row g-3">
            <div className="col-12">
              <div className="auth-zine-field">
                <label htmlFor="name">Име *</label>
                <input id="name" className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required maxLength={100} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="price">Цена</label>
                <input id="price" type="number" min="0" step="0.01" className="form-control" value={form.price} onChange={e => set('price', e.target.value)} required />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="quantity">Количество</label>
                <input id="quantity" type="number" min="0" step="1" className="form-control" value={form.quantityTotal} onChange={e => set('quantityTotal', e.target.value)} required />
              </div>
            </div>
            <div className="col-12">
              <div className="auth-zine-field">
                <label htmlFor="description">Описание</label>
                <textarea id="description" className="form-control" rows={4} value={form.description} onChange={e => set('description', e.target.value)} maxLength={1000} />
              </div>
            </div>
            <div className="col-12">
              <div className="auth-zine-field">
                <label htmlFor="imageUrl">URL на снимка</label>
                <input id="imageUrl" type="url" className="form-control" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="col-md-6">
              <label className="d-flex align-items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                Активен билет
              </label>
            </div>
            <div className="col-md-6">
              <label className="d-flex align-items-center gap-2">
                <input type="checkbox" checked={form.requiresAttendeeNames} onChange={e => set('requiresAttendeeNames', e.target.checked)} />
                Имена на посетители
              </label>
            </div>
          </div>
          <div className="groove-form-actions mt-4">
            <button type="submit" className="auth-zine-button auth-zine-button-red" disabled={loading}>
              <i className="bi bi-plus-lg" /> {loading ? 'Създаване...' : 'Създай билет'}
            </button>
            <Link href={`/tickets/manage/${eventId}`} className="groove-button groove-button-paper">Отказ</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
