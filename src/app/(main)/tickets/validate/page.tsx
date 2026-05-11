'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

interface ValidationTicket {
  eventTitle: string
  ticketName: string
  ownerUserName: string
  ownerEmail: string
  attendeeName?: string
  startTime: string
  address: string
  city: string
  isUsed: boolean
}

interface ValidationResult {
  valid: boolean
  requiresConfirmation?: boolean
  alreadyUsed?: boolean
  message: string
  ticket?: ValidationTicket
}

export default function TicketValidatePage() {
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)

  async function submit(confirm: boolean) {
    setLoading(true)
    try {
      const res = await api.post<ValidationResult>('/api/tickets/validate', { qrCode, confirm })
      setResult(res.data)
    } catch (error) {
      const err = error as { response?: { data?: ValidationResult } }
      setResult(err.response?.data ?? { valid: false, message: 'Грешка при валидиране.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Валидиране</span>
          <h1 className="groove-panel-title">Проверка на билет</h1>
          <p>Сканирай или постави QR кода от билета и потвърди входа.</p>
        </div>
      </div>

      <div className="groove-paper-card mt-4">
        <label className="form-label fw-bold" htmlFor="qrCode">QR код</label>
        <textarea
          id="qrCode"
          className="form-control"
          rows={3}
          value={qrCode}
          onChange={e => setQrCode(e.target.value)}
          placeholder="Постави кода тук..."
        />
        <div className="groove-form-actions mt-3">
          <button className="groove-button groove-button-dark" disabled={loading || !qrCode.trim()} onClick={() => submit(false)}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search" />}
            <span>Провери</span>
          </button>
        </div>
      </div>

      {result && (
        <div className={`groove-paper-card mt-4 ${result.valid ? 'border-success' : result.alreadyUsed ? 'border-warning' : 'border-danger'}`}>
          <h2 className="groove-panel-title mb-2">{result.message}</h2>
          {result.ticket && (
            <dl className="groove-data-list mt-3">
              <dt>Събитие</dt>
              <dd>{result.ticket.eventTitle}</dd>
              <dt>Билет</dt>
              <dd>{result.ticket.ticketName}</dd>
              <dt>Притежател</dt>
              <dd>{result.ticket.attendeeName || result.ticket.ownerUserName} ({result.ticket.ownerEmail})</dd>
              <dt>Начало</dt>
              <dd>{new Date(result.ticket.startTime).toLocaleString('bg-BG')}</dd>
              <dt>Локация</dt>
              <dd>{result.ticket.address}, {result.ticket.city}</dd>
            </dl>
          )}
          {result.requiresConfirmation && (
            <button className="groove-button groove-button-dark mt-3" disabled={loading} onClick={() => submit(true)}>
              <i className="bi bi-check2-circle" /> <span>Потвърди валидиране</span>
            </button>
          )}
        </div>
      )}
    </section>
  )
}
