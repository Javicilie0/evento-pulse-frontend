'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { MediaUploadField } from '@/components/forms/MediaUploadField'

interface TicketForm {
  id: string
  eventId: number
  eventTitle: string
  name: string
  description?: string
  price: number
  quantityTotal: number
  imageUrl?: string
  isActive: boolean
  requiresAttendeeNames: boolean
}

export default function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<TicketForm>(`/api/tickets/manage/${id}`)
      .then(r => setTicket(r.data))
      .catch(() => setError('Билетът не може да бъде зареден.'))
  }, [id])

  function set(field: keyof TicketForm, value: string | number | boolean) {
    setTicket(prev => prev ? ({ ...prev, [field]: value }) : prev)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ticket) return
    setSaving(true)
    setError('')
    try {
      await api.put(`/api/tickets/${id}`, {
        name: ticket.name,
        description: ticket.description || undefined,
        price: Number(ticket.price),
        quantityTotal: Number(ticket.quantityTotal),
        imageUrl: ticket.imageUrl || undefined,
        isActive: ticket.isActive,
        requiresAttendeeNames: ticket.requiresAttendeeNames,
      })
      router.push(`/tickets/manage/${ticket.eventId}`)
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Билетът не може да бъде запазен.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Билети</span>
          <h1 className="groove-panel-title">Редакция на билет</h1>
          {ticket && <p className="groove-panel-intro mb-0">{ticket.eventTitle}</p>}
        </div>
        {ticket && <Link href={`/tickets/manage/${ticket.eventId}`} className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>}
      </div>
      <div className="groove-paper-card">
        {!ticket ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : (
          <form onSubmit={handleSubmit} className="auth-zine-form">
            {error && <div className="auth-zine-validation" role="alert"><ul><li>{error}</li></ul></div>}
            <div className="row g-3">
              <div className="col-12"><div className="auth-zine-field"><label>Име *</label><input className="form-control" value={ticket.name} onChange={e => set('name', e.target.value)} required /></div></div>
              <div className="col-md-6"><div className="auth-zine-field"><label>Цена</label><input type="number" min="0" step="0.01" className="form-control" value={ticket.price} onChange={e => set('price', Number(e.target.value))} /></div></div>
              <div className="col-md-6"><div className="auth-zine-field"><label>Количество</label><input type="number" min="0" className="form-control" value={ticket.quantityTotal} onChange={e => set('quantityTotal', Number(e.target.value))} /></div></div>
              <div className="col-12"><div className="auth-zine-field"><label>Описание</label><textarea className="form-control" rows={4} value={ticket.description ?? ''} onChange={e => set('description', e.target.value)} /></div></div>
              <div className="col-12"><MediaUploadField label="Снимка на билет" folder="tickets" value={ticket.imageUrl ?? ''} onChange={url => set('imageUrl', url)} /></div>
              <div className="col-md-6"><label className="d-flex gap-2"><input type="checkbox" checked={ticket.isActive} onChange={e => set('isActive', e.target.checked)} /> Активен</label></div>
              <div className="col-md-6"><label className="d-flex gap-2"><input type="checkbox" checked={ticket.requiresAttendeeNames} onChange={e => set('requiresAttendeeNames', e.target.checked)} /> Имена на посетители</label></div>
            </div>
            <div className="groove-form-actions mt-4">
              <button className="auth-zine-button auth-zine-button-red" disabled={saving}><i className="bi bi-check2" /> {saving ? 'Запазване...' : 'Запази'}</button>
              <Link href={`/tickets/manage/${ticket.eventId}`} className="groove-button groove-button-paper">Отказ</Link>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
