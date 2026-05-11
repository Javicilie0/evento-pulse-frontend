import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'

interface AdminTicket {
  id: string
  eventId: number
  eventTitle: string
  ticketName: string
  ownerName: string
  ownerEmail: string
  pricePaid: number
  isUsed: boolean
  createdAt: string
  usedAt?: string
}

async function getTickets() {
  try {
    const res = await (await authenticatedServerApi()).get<AdminTicket[]>('/api/admin/tickets')
    return res.data
  } catch {
    return []
  }
}

export default async function AdminTicketsPage() {
  const tickets = await getTickets()
  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Администратор</span>
          <h1 className="groove-panel-title">Билети</h1>
        </div>
        <Link href="/admin" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>
      </div>
      <div className="groove-paper-card">
        <div className="table-responsive">
          <table className="table table-hover groove-table">
            <thead><tr><th>Билет</th><th>Събитие</th><th>Притежател</th><th>Цена</th><th>Статус</th><th>Дата</th></tr></thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td>{t.ticketName}</td>
                  <td><Link href={`/events/${t.eventId}`}>{t.eventTitle}</Link></td>
                  <td><strong>{t.ownerName}</strong><div className="small text-muted">{t.ownerEmail}</div></td>
                  <td>{t.pricePaid.toFixed(2)} лв</td>
                  <td>{t.isUsed ? <span className="badge bg-secondary">Използван</span> : <span className="badge bg-success">Валиден</span>}</td>
                  <td>{format(new Date(t.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
