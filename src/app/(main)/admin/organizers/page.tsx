'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface OrganizerRow {
  organizerId: string
  userName: string
  email: string
  organizationName: string
  phoneNumber?: string
  city?: string
  country?: string
  website?: string
  companyNumber?: string
  approved: boolean
  createdAt: string
}

export default function AdminOrganizersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [organizers, setOrganizers] = useState<OrganizerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    const roles = (session as any)?.user?.roles as string[] | undefined
    if (!roles?.includes('Admin')) { router.push('/'); return }
    api.get<OrganizerRow[]>('/api/admin/organizers').then(r => setOrganizers(r.data)).finally(() => setLoading(false))
  }, [status, session, router])

  async function toggleApprove(id: string) {
    setActionId(id)
    try {
      const res = await api.post<{ approved: boolean }>(`/api/admin/organizers/${id}/approve`)
      setOrganizers(prev => prev.map(o => o.organizerId === id ? { ...o, approved: res.data.approved } : o))
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return <section className="groove-app-page"><div className="text-center py-5"><div className="spinner-border text-primary" /></div></section>
  }

  const pending = organizers.filter(o => !o.approved)
  const approved = organizers.filter(o => o.approved)

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Администратор</span>
          <h1 className="groove-panel-title">Организатори</h1>
        </div>
        <Link href="/admin" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>
      </div>

      {pending.length > 0 && (
        <div className="groove-paper-card mb-4">
          <h2 className="groove-panel-title mb-3 text-danger">
            <i className="bi bi-exclamation-triangle me-2" />Чакащи одобрение ({pending.length})
          </h2>
          <OrganizerTable rows={pending} onToggle={toggleApprove} actionId={actionId} />
        </div>
      )}

      <div className="groove-paper-card">
        <h2 className="groove-panel-title mb-3">Одобрени ({approved.length})</h2>
        <OrganizerTable rows={approved} onToggle={toggleApprove} actionId={actionId} />
      </div>
    </section>
  )
}

function OrganizerTable({ rows, onToggle, actionId }: { rows: OrganizerRow[]; onToggle: (id: string) => void; actionId: string | null }) {
  return (
    <div className="table-responsive">
      <table className="table table-hover groove-table">
        <thead>
          <tr>
            <th>Потребител</th>
            <th>Организация</th>
            <th>Град</th>
            <th>Телефон</th>
            <th>Дата</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(o => (
            <tr key={o.organizerId}>
              <td>
                <strong>{o.userName}</strong>
                <div className="small text-muted">{o.email}</div>
              </td>
              <td>
                {o.organizationName}
                {o.companyNumber && <div className="small text-muted">ЕИК: {o.companyNumber}</div>}
              </td>
              <td>{o.city}{o.country && `, ${o.country}`}</td>
              <td>{o.phoneNumber ?? '—'}</td>
              <td>{format(new Date(o.createdAt), 'dd.MM.yyyy')}</td>
              <td>
                {o.approved
                  ? <span className="badge bg-success">Одобрен</span>
                  : <span className="badge bg-warning text-dark">Чака</span>}
              </td>
              <td>
                <button
                  className={`groove-button groove-button--sm ${o.approved ? 'groove-button-paper' : 'groove-button-dark'}`}
                  onClick={() => onToggle(o.organizerId)}
                  disabled={actionId === o.organizerId}
                >
                  {actionId === o.organizerId
                    ? <span className="spinner-border spinner-border-sm" />
                    : o.approved ? 'Отнеми' : 'Одобри'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
