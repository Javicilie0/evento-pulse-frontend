'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface TicketDetails {
  id: string
  eventId?: number
  eventTitle: string
  ticketName?: string
  ticketType?: string
  address?: string
  city?: string
  startTime?: string
  eventStartTime?: string
  endTime?: string | null
  seatLabel?: string | null
  attendeeName?: string | null
  purchaseGroupId?: string
  isPrimaryInPurchase?: boolean
  price?: number
  currency?: string
  transactionStatus?: string
  ownerUserName?: string
  ownerEmail?: string
  createdAt?: string
  purchasedAt?: string
  isUsed: boolean
  usedAt?: string | null
  usedByOrganizerName?: string | null
  qrCode?: string
  qrCodeUrl?: string
}

function formatDate(value?: string | null) {
  if (!value) return 'Няма данни'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : format(date, 'dd.MM.yyyy HH:mm')
}

function formatPrice(value?: number, currency = 'лв') {
  if (value === undefined || value === null) return 'Няма данни'
  return `${value.toFixed(2)} ${currency}`
}

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<TicketDetails>(`/api/tickets/${id}`)
      .then(r => setTicket(r.data))
      .catch(() => setError('Билетът не може да бъде зареден.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <section className="groove-app-page">
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      </section>
    )
  }

  if (error || !ticket) {
    return (
      <section className="groove-app-page">
        <div className="groove-empty-card">
          <i className="bi bi-ticket-perforated" />
          <h1 className="groove-panel-title">Билетът не е намерен</h1>
          <p className="groove-panel-intro">{error || 'Няма данни за този билет.'}</p>
          <Link href="/tickets" className="groove-button groove-button-paper mt-3">
            <i className="bi bi-arrow-left" /> Моите билети
          </Link>
        </div>
      </section>
    )
  }

  const title = ticket.eventTitle
  const ticketName = ticket.ticketName ?? ticket.ticketType ?? 'Билет'
  const startTime = ticket.startTime ?? ticket.eventStartTime
  const createdAt = ticket.createdAt ?? ticket.purchasedAt
  const statusClass = ticket.isUsed ? 'groove-status-badge-muted' : 'groove-status-badge-success'

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Билет</span>
          <h1>{title}</h1>
          <p>{ticketName}</p>
        </div>
        <div className="groove-page-actions">
          <Link href="/tickets" className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Към Моите билети
          </Link>
          <a href={`/api/tickets/${id}/pdf`} className="groove-button groove-button-dark">
            <i className="bi bi-file-earmark-pdf" /> Изтегли PDF
          </a>
        </div>
      </div>

      <div className="groove-split">
        <div className="groove-info-card">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <h2 className="groove-panel-title">{ticketName}</h2>
            <span className={`groove-status-badge ${statusClass}`}>{ticket.isUsed ? 'Използван' : 'Валиден'}</span>
          </div>

          <dl className="groove-data-list mt-4">
            <dt>Локация</dt>
            <dd>{[ticket.address, ticket.city].filter(Boolean).join(', ') || 'Няма данни'}</dd>

            <dt>Начало</dt>
            <dd>{formatDate(startTime)}</dd>

            {ticket.endTime && <><dt>Край</dt><dd>{formatDate(ticket.endTime)}</dd></>}
            {ticket.seatLabel && <><dt>Място</dt><dd>{ticket.seatLabel}</dd></>}
            {ticket.attendeeName && <><dt>Име на билета</dt><dd>{ticket.attendeeName}</dd></>}
            {ticket.purchaseGroupId && <><dt>Група</dt><dd>{ticket.isPrimaryInPurchase ? 'Основен билет' : 'Допълнителен билет'}</dd></>}

            <dt>Цена</dt>
            <dd>{formatPrice(ticket.price, ticket.currency)}</dd>

            {ticket.transactionStatus && <><dt>Транзакция</dt><dd>{ticket.transactionStatus}</dd></>}
            {(ticket.ownerUserName || ticket.ownerEmail) && <><dt>Притежател</dt><dd>{[ticket.ownerUserName, ticket.ownerEmail].filter(Boolean).join(' - ')}</dd></>}

            <dt>Купен</dt>
            <dd>{formatDate(createdAt)}</dd>

            {ticket.isUsed && ticket.usedAt && <><dt>Използван</dt><dd>{formatDate(ticket.usedAt)}</dd></>}
            {ticket.usedByOrganizerName && <><dt>Проверен от</dt><dd>{ticket.usedByOrganizerName}</dd></>}
          </dl>
        </div>

        <div className="groove-info-card groove-qr-card">
          <span className="groove-kicker">Вход</span>
          <h2 className="groove-panel-title">Твоят <span>QR код</span>.</h2>
          <img src={`/api/tickets/${id}/qr`} alt="QR код за вход" className="img-fluid mt-3" />
          {ticket.qrCode && <div className="groove-code">{ticket.qrCode}</div>}
          <p className="groove-panel-intro mt-3 mb-0">Покажи този код на входа за валидиране.</p>
        </div>
      </div>
    </section>
  )
}
