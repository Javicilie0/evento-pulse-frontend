'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface TicketRow {
  id: string
  name: string
  description?: string
  price: number
  quantityTotal: number
  quantityRemaining: number
  soldCount: number
  isActive: boolean
}

interface ManageResponse {
  eventId: number
  eventTitle: string
  tickets: TicketRow[]
}

export default function ManageTicketsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [eventId, setEventId] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setEventId(p.eventId)
      api.get<ManageResponse>(`/api/tickets/event/${p.eventId}`)
        .then(r => {
          setEventTitle(r.data.eventTitle)
          setTickets(r.data.tickets)
        })
        .catch(() => setError('Билетите не могат да бъдат заредени.'))
        .finally(() => setLoading(false))
    })
  }, [params])

  async function deleteTicket(id: string) {
    if (!confirm('Да изтрия ли този билет?')) return
    setActionId(id)
    setError('')
    try {
      await api.delete(`/api/tickets/${id}`)
      setTickets(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Билетът не може да бъде изтрит.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Организатор</span>
          <h1 className="groove-panel-title">Билети</h1>
          {eventTitle && <p className="groove-panel-intro mb-0">{eventTitle}</p>}
        </div>
        <div className="groove-page-actions">
          <Link href={`/tickets/create/${eventId}`} className="groove-button groove-button-dark">
            <i className="bi bi-plus-lg" /> Добави билет
          </Link>
          <Link href={`/events/${eventId}`} className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Събитие
          </Link>
        </div>
      </div>

      {error && <div className="auth-zine-validation mb-3" role="alert"><ul><li>{error}</li></ul></div>}

      <div className="groove-paper-card">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : tickets.length === 0 ? (
          <div className="groove-empty-card m-0">
            <i className="bi bi-ticket-perforated" />
            <h2 className="groove-panel-title">Няма билети</h2>
            <p className="groove-panel-intro">Добави първия билет за това събитие.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover groove-table">
              <thead>
                <tr>
                  <th>Билет</th>
                  <th>Цена</th>
                  <th>Продадени</th>
                  <th>Оставащи</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td><strong>{ticket.name}</strong>{ticket.description && <div className="small text-muted">{ticket.description}</div>}</td>
                    <td>{ticket.price.toFixed(2)} лв</td>
                    <td>{ticket.soldCount}</td>
                    <td>{ticket.quantityRemaining} / {ticket.quantityTotal}</td>
                    <td>{ticket.isActive ? <span className="badge bg-success">Активен</span> : <span className="badge bg-secondary">Спрян</span>}</td>
                    <td className="text-end">
                      <Link href={`/tickets/edit/${ticket.id}`} className="groove-button groove-button-paper groove-button--sm me-2">
                        <i className="bi bi-pencil" />
                      </Link>
                      <button className="groove-button groove-button-paper groove-button--sm text-danger" type="button" onClick={() => deleteTicket(ticket.id)} disabled={actionId === ticket.id}>
                        {actionId === ticket.id ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-trash" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
