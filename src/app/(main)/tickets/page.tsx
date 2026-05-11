import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'
import type { UserTicket } from '@/types/api'

async function getTickets(): Promise<UserTicket[]> {
  try {
    const res = await (await authenticatedServerApi()).get<UserTicket[]>('/api/tickets/mine')
    return res.data
  } catch {
    return []
  }
}

export default async function TicketsPage() {
  const tickets = await getTickets()

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-red" data-i18n="tickets.page.stamp">Билети</span>
          <h1 data-i18n-html="tickets.page.title">Твоите <span>запазени</span> места.</h1>
          <p data-i18n="tickets.page.desc">
            Всички купени билети са тук, заедно с QR кода и PDF версията.
          </p>
        </div>
        <div className="groove-page-actions">
          <Link href="/" className="groove-button groove-button-paper">
            <i className="bi bi-calendar2-event" /> <span data-i18n="tickets.explore">Разгледай събития</span>
          </Link>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="groove-empty-card">
          <i className="bi bi-ticket-perforated" />
          <h2 className="groove-panel-title" data-i18n-html="tickets.empty.title">
            Още нямаш <span>купени билети</span>.
          </h2>
          <p className="groove-panel-intro" data-i18n="tickets.empty.desc">
            Когато вземеш билет за събитие, той ще се появи тук с всички детайли за вход.
          </p>
          <div className="groove-form-actions justify-content-center">
            <Link href="/" className="groove-button groove-button-dark">
              <i className="bi bi-search" /> <span data-i18n="tickets.find">Намери събитие</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="groove-ticket-grid">
          {tickets.map(t => (
            <article key={t.id} className="groove-ticket-card">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <span className="groove-ticket-meta">
                  Купен на {format(new Date(t.purchasedAt), 'dd.MM.yyyy HH:mm')}
                </span>
                <span className={`groove-status-badge ${t.isUsed ? 'groove-status-badge-muted' : 'groove-status-badge-success'}`}
                  data-i18n={t.isUsed ? 'tickets.used' : 'tickets.valid'}>
                  {t.isUsed ? 'Използван' : 'Валиден'}
                </span>
              </div>

              <h3 className="mt-3">{t.eventTitle}</h3>
              <p>{t.ticketType}</p>

              <dl className="groove-data-list mt-3">
                <dt data-i18n="tickets.dt.location">Локация</dt>
                <dd>{t.eventAddress}, {t.eventCity}</dd>
                <dt data-i18n="tickets.dt.start">Начало</dt>
                <dd>{format(new Date(t.eventStartTime), 'dd.MM.yyyy HH:mm')}</dd>
              </dl>

              {t.qrCodeUrl && (
                <div className="text-center mt-3">
                  <img src={`/api/tickets/${t.id}/qr`} alt="QR код" style={{ maxWidth: 160, border: '1px solid var(--bs-border-color)', padding: 8, borderRadius: 8 }} />
                </div>
              )}

              <div className="groove-form-actions mt-3">
                <Link href={`/events/${t.eventId}`} className="groove-button groove-button-paper">
                  <i className="bi bi-calendar-event" /> <span data-i18n="tickets.view.event">Виж събитието</span>
                </Link>
                <a href={`/api/tickets/${t.id}/pdf`} className="groove-button groove-button-dark">
                  <i className="bi bi-file-earmark-pdf" /> <span>PDF</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
