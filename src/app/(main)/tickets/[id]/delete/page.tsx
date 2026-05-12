'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

interface TicketForDelete {
  id: string
  eventId?: number
  eventTitle?: string
  name?: string
  ticketName?: string
  price?: number
  quantityTotal?: number
  quantityRemaining?: number
  soldCount?: number
}

type ApiError = {
  response?: {
    data?: {
      error?: string
    }
  }
}

export default function DeleteTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketForDelete | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<TicketForDelete>(`/api/tickets/manage/${id}`)
      .then(r => setTicket(r.data))
      .catch(() => setError('Билетът не може да бъде зареден.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    setSubmitting(true)
    setError('')
    try {
      await api.delete(`/api/tickets/${id}`)
      router.push(ticket?.eventId ? `/tickets/manage/${ticket.eventId}` : '/tickets/manage')
      router.refresh()
    } catch (err: unknown) {
      const apiError = err as ApiError
      setError(apiError.response?.data?.error || 'Билетът не може да бъде изключен.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="groove-app-page">
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      </section>
    )
  }

  const name = ticket?.name ?? ticket?.ticketName ?? 'този тип билет'
  const eventTitle = ticket?.eventTitle ?? 'събитието'
  const backHref = ticket?.eventId ? `/tickets/manage/${ticket.eventId}` : '/tickets/manage'

  return (
    <section className="groove-app-page groove-form-shell groove-form-shell-narrow">
      <div className="groove-empty-card">
        <i className="bi bi-slash-circle" />
        <h1 className="groove-panel-title">Изключи този <span>тип билет</span>?</h1>
        <p className="groove-panel-intro">
          <strong>{name}</strong> за <strong>{eventTitle}</strong> ще спре да се продава,
          но вече купените билети ще останат валидни.
        </p>

        {ticket && (
          <dl className="groove-data-list text-start mt-4">
            <dt>Цена</dt>
            <dd>{ticket.price !== undefined ? `${ticket.price.toFixed(2)} лв` : 'Няма данни'}</dd>
            <dt>Общо</dt>
            <dd>{ticket.quantityTotal ?? 'Няма данни'}</dd>
            <dt>Остават</dt>
            <dd>{ticket.quantityRemaining ?? 'Няма данни'}</dd>
            <dt>Продадени</dt>
            <dd>{ticket.soldCount ?? 'Няма данни'}</dd>
          </dl>
        )}

        {error && <div className="auth-zine-validation mt-3" role="alert"><ul><li>{error}</li></ul></div>}

        <div className="groove-form-actions justify-content-center mt-4">
          <button type="button" className="groove-button groove-button-dark" onClick={handleDelete} disabled={submitting}>
            <i className="bi bi-slash-circle" /> {submitting ? 'Изключване...' : 'Изключи'}
          </button>
          <Link href={backHref} className="groove-button groove-button-paper">Отказ</Link>
        </div>
      </div>
    </section>
  )
}
