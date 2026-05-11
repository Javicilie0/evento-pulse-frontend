'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface EventChange {
  id: number
  eventId: number
  eventTitle: string
  organizerName: string
  submittedAt: string
  changeJson: string
}

export default function AdminEventChangesPage() {
  const [rows, setRows] = useState<EventChange[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => {
    api.get<EventChange[]>('/api/admin/event-changes')
      .then(r => setRows(r.data))
      .finally(() => setLoading(false))
  }, [])

  async function act(id: number, action: 'approve' | 'reject') {
    setActionId(id)
    try {
      await api.post(`/api/admin/event-changes/${id}/${action}`)
      setRows(prev => prev.filter(r => r.id !== id))
    } finally {
      setActionId(null)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Администратор</span>
          <h1 className="groove-panel-title">Промени по събития</h1>
        </div>
        <Link href="/admin/events?pending=true" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Събития</Link>
      </div>
      <div className="groove-paper-card">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : rows.length === 0 ? (
          <div className="groove-empty-card m-0"><i className="bi bi-check2-circle" /><h2 className="groove-panel-title">Няма чакащи промени</h2></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover groove-table">
              <thead><tr><th>Събитие</th><th>Организатор</th><th>Подадено</th><th>Payload</th><th></th></tr></thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td><Link href={`/events/${row.eventId}`}>{row.eventTitle}</Link></td>
                    <td>{row.organizerName}</td>
                    <td>{format(new Date(row.submittedAt), 'dd.MM.yyyy HH:mm')}</td>
                    <td><pre className="small mb-0" style={{ maxWidth: 420, whiteSpace: 'pre-wrap' }}>{row.changeJson}</pre></td>
                    <td className="text-end">
                      <button className="groove-button groove-button-dark groove-button--sm me-2" disabled={actionId === row.id} onClick={() => act(row.id, 'approve')}>Одобри</button>
                      <button className="groove-button groove-button-paper groove-button--sm" disabled={actionId === row.id} onClick={() => act(row.id, 'reject')}>Откажи</button>
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
