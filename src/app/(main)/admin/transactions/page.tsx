import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'

interface AdminTransaction {
  id: string
  userName: string
  userEmail: string
  totalAmount: number
  status: string
  createdAt: string
  ticketsCount: number
  eventTitle?: string
}

async function getTransactions() {
  try {
    const res = await (await authenticatedServerApi()).get<AdminTransaction[]>('/api/admin/transactions')
    return res.data
  } catch {
    return []
  }
}

export default async function AdminTransactionsPage() {
  const transactions = await getTransactions()
  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Администратор</span>
          <h1 className="groove-panel-title">Транзакции</h1>
        </div>
        <Link href="/admin" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>
      </div>
      <div className="groove-paper-card">
        <div className="table-responsive">
          <table className="table table-hover groove-table">
            <thead><tr><th>ID</th><th>Потребител</th><th>Събитие</th><th>Билети</th><th>Сума</th><th>Статус</th><th>Дата</th></tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td className="small">{t.id.slice(0, 8)}</td>
                  <td><strong>{t.userName}</strong><div className="small text-muted">{t.userEmail}</div></td>
                  <td>{t.eventTitle ?? '-'}</td>
                  <td>{t.ticketsCount}</td>
                  <td>{t.totalAmount.toFixed(2)} лв</td>
                  <td><span className="badge bg-secondary">{t.status}</span></td>
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
