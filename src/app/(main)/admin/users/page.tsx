'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

interface AdminUser {
  id: string
  userName: string
  email: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  roles: string[]
}

const ROLES = ['User', 'Organizer', 'Admin']

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    const roles = (session as any)?.user?.roles as string[] | undefined
    if (!roles?.includes('Admin')) { router.push('/'); return }
    api.get<AdminUser[]>('/api/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [status, session, router])

  async function setRole(id: string, role: string) {
    setActionId(id)
    try {
      await api.post(`/api/admin/users/${id}/role`, { role })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, roles: [role] } : u))
    } finally {
      setActionId(null)
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Изтрий потребителя ${name}? Действието е необратимо.`)) return
    setActionId(id)
    try {
      await api.delete(`/api/admin/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Грешка')
    } finally {
      setActionId(null)
    }
  }

  const filtered = users.filter(u =>
    u.userName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <section className="groove-app-page"><div className="text-center py-5"><div className="spinner-border text-primary" /></div></section>
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Администратор</span>
          <h1 className="groove-panel-title">Потребители ({users.length})</h1>
        </div>
        <Link href="/admin" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>
      </div>

      <div className="groove-paper-card mb-4">
        <input
          type="search"
          className="form-control"
          placeholder="Търси по потребителско име или имейл..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="groove-paper-card">
        <div className="table-responsive">
          <table className="table table-hover groove-table">
            <thead>
              <tr>
                <th>Потребител</th>
                <th>Имейл</th>
                <th>Роля</th>
                <th>Промяна на роля</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {u.profileImageUrl
                        ? <img src={u.profileImageUrl} className="rounded-circle" width={32} height={32} alt="" style={{ objectFit: 'cover' }} />
                        : <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                            <i className="bi bi-person text-white small" />
                          </div>}
                      <div>
                        <strong>{u.userName}</strong>
                        {(u.firstName || u.lastName) && (
                          <div className="small text-muted">{[u.firstName, u.lastName].filter(Boolean).join(' ')}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {u.roles.map(r => (
                      <span key={r} className={`badge me-1 ${r === 'Admin' ? 'bg-danger' : r === 'Organizer' ? 'bg-primary' : 'bg-secondary'}`}>
                        {r}
                      </span>
                    ))}
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={u.roles[0] ?? 'User'}
                      onChange={e => setRole(u.id, e.target.value)}
                      disabled={actionId === u.id}
                      style={{ maxWidth: 130 }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <button
                      className="groove-button groove-button-paper groove-button--sm text-danger"
                      onClick={() => deleteUser(u.id, u.userName)}
                      disabled={actionId === u.id}
                      title="Изтрий потребителя"
                    >
                      {actionId === u.id ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-trash" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
