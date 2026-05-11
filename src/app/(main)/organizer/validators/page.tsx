'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface ValidatorRow {
  id: number
  validatorUserName: string
  validatorEmail: string
  organizerProfileName?: string
  isActive: boolean
  createdAt: string
}

interface OrganizerProfile { id: number; displayName: string }

export default function OrganizerValidatorsPage() {
  const [validators, setValidators] = useState<ValidatorRow[]>([])
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([])
  const [email, setEmail] = useState('')
  const [organizerProfileId, setOrganizerProfileId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    const [validatorsRes, profilesRes] = await Promise.all([
      api.get<ValidatorRow[]>('/api/organizer/validators'),
      api.get<OrganizerProfile[]>('/api/organizer/profiles'),
    ])
    setValidators(validatorsRes.data)
    setProfiles(profilesRes.data)
  }

  useEffect(() => {
    load().catch(() => setError('Валидаторите не могат да бъдат заредени.')).finally(() => setLoading(false))
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/organizer/validators', { email, organizerProfileId: organizerProfileId ? Number(organizerProfileId) : undefined })
      setEmail('')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Валидаторът не може да бъде добавен.')
    }
  }

  async function remove(id: number) {
    await api.delete(`/api/organizer/validators/${id}`)
    setValidators(prev => prev.map(v => v.id === id ? { ...v, isActive: false } : v))
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Организатор</span>
          <h1 className="groove-panel-title">Валидатори</h1>
        </div>
        <Link href="/organizer/dashboard" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Табло</Link>
      </div>
      <div className="groove-paper-card mb-4">
        <form onSubmit={add} className="row g-3 align-items-end">
          {error && <div className="col-12"><div className="auth-zine-validation"><ul><li>{error}</li></ul></div></div>}
          <div className="col-md-5"><div className="auth-zine-field"><label>Имейл</label><input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required /></div></div>
          <div className="col-md-5"><div className="auth-zine-field"><label>Public page</label><select className="form-select" value={organizerProfileId} onChange={e => setOrganizerProfileId(e.target.value)}><option value="">Всички/основна</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}</select></div></div>
          <div className="col-md-2"><button className="groove-button groove-button-dark w-100"><i className="bi bi-plus-lg" /> Добави</button></div>
        </form>
      </div>
      <div className="groove-paper-card">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : (
          <div className="table-responsive">
            <table className="table table-hover groove-table">
              <thead><tr><th>Потребител</th><th>Страница</th><th>Статус</th><th>Добавен</th><th></th></tr></thead>
              <tbody>{validators.map(v => <tr key={v.id}><td><strong>{v.validatorUserName}</strong><div className="small text-muted">{v.validatorEmail}</div></td><td>{v.organizerProfileName ?? '-'}</td><td>{v.isActive ? <span className="badge bg-success">Активен</span> : <span className="badge bg-secondary">Спрян</span>}</td><td>{format(new Date(v.createdAt), 'dd.MM.yyyy')}</td><td className="text-end">{v.isActive && <button className="groove-button groove-button-paper groove-button--sm text-danger" onClick={() => remove(v.id)}><i className="bi bi-x-lg" /></button>}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
