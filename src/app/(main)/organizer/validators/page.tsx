'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface ValidatorRow {
  id: number
  validatorUserName: string
  validatorEmail: string
  validatorPhoneNumber?: string | null
  organizerProfileId?: number | null
  organizerProfileName?: string | null
  isActive: boolean
  createdAt: string
}

interface OrganizerProfile {
  id: number
  displayName: string
}

export default function OrganizerValidatorsPage() {
  const [validators, setValidators] = useState<ValidatorRow[]>([])
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([])
  const [userLookup, setUserLookup] = useState('')
  const [organizerProfileId, setOrganizerProfileId] = useState('')
  const [pageSelections, setPageSelections] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function load() {
    const [validatorsRes, profilesRes] = await Promise.all([
      api.get<ValidatorRow[]>('/api/organizer/validators'),
      api.get<OrganizerProfile[]>('/api/organizer/profiles'),
    ])

    setValidators(validatorsRes.data)
    setProfiles(profilesRes.data)
    setPageSelections(Object.fromEntries(validatorsRes.data.map(v => [v.id, String(v.organizerProfileId ?? '')])))

    if (!organizerProfileId && profilesRes.data.length > 0) {
      setOrganizerProfileId(String(profilesRes.data[0].id))
    }
  }

  useEffect(() => {
    load().catch(() => setError('Валидаторите не могат да бъдат заредени.')).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCountForSelectedPage = useMemo(() => {
    const selected = Number(organizerProfileId)
    if (!selected) return 0
    return validators.filter(v => v.isActive && v.organizerProfileId === selected).length
  }, [organizerProfileId, validators])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!organizerProfileId) {
      setError('Първо избери публична страница.')
      return
    }

    try {
      await api.post('/api/organizer/validators', {
        userLookup,
        email: userLookup,
        organizerProfileId: Number(organizerProfileId),
      })
      setUserLookup('')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Валидаторът не може да бъде добавен.')
    }
  }

  async function updatePage(id: number) {
    const nextProfileId = Number(pageSelections[id])
    if (!nextProfileId) {
      setError('Избери публична страница за този валидатор.')
      return
    }

    setSavingId(id)
    setError('')
    try {
      await api.put(`/api/organizer/validators/${id}`, { organizerProfileId: nextProfileId })
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Страницата на валидатора не може да бъде обновена.')
    } finally {
      setSavingId(null)
    }
  }

  async function remove(id: number) {
    setSavingId(id)
    setError('')
    try {
      await api.delete(`/api/organizer/validators/${id}`)
      setValidators(prev => prev.map(v => v.id === id ? { ...v, isActive: false } : v))
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Валидаторът не може да бъде спрян.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Контрол на билети</span>
          <h1 className="groove-panel-title">Достъп за валидатори.</h1>
          <p className="text-muted mb-0">Добавяй до 3 служебни акаунта към всяка public page. Те виждат само QR валидирането за събитията на страницата.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link href="/tickets/validate" className="groove-button groove-button-dark">
            <i className="bi bi-qr-code-scan" /> Валидирай билети
          </Link>
          <Link href="/organizer/dashboard" className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Табло
          </Link>
        </div>
      </div>

      {error && (
        <div className="auth-zine-validation mb-4">
          <ul><li>{error}</li></ul>
        </div>
      )}

      <div className="groove-split mb-4">
        <div className="groove-paper-card">
          <div className="d-flex justify-content-between gap-3 align-items-start mb-3">
            <div>
              <span className="groove-kicker">Ново право</span>
              <h2 className="h4 mb-1">Добави валидатор</h2>
              <p className="text-muted mb-0">Потърси съществуващ потребител и го вържи към конкретна публична страница.</p>
            </div>
            <span className="badge rounded-pill text-bg-light">{activeCountForSelectedPage}/3</span>
          </div>

          {profiles.length === 0 ? (
            <div className="empty-state">
              <p className="mb-3">Първо създай public page за workspace-а, после можеш да добавяш валидатори към нея.</p>
              <Link href="/organizer/profiles/new" className="groove-button groove-button-dark">
                <i className="bi bi-plus-lg" /> Нова public page
              </Link>
            </div>
          ) : (
            <form onSubmit={add} className="row g-3">
              <div className="col-12">
                <div className="auth-zine-field">
                  <label>Имейл, потребителско име или телефон</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userLookup}
                    onChange={e => setUserLookup(e.target.value)}
                    placeholder="validator@example.com, username или +359..."
                    required
                  />
                </div>
              </div>
              <div className="col-12">
                <div className="auth-zine-field">
                  <label>Public page</label>
                  <select className="form-select" value={organizerProfileId} onChange={e => setOrganizerProfileId(e.target.value)} required>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-12">
                <button className="groove-button groove-button-dark w-100" disabled={activeCountForSelectedPage >= 3}>
                  <i className="bi bi-plus-lg" /> Добави към страницата
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="groove-paper-card">
          <span className="groove-kicker">Правила</span>
          <h2 className="h4 mb-3">Как работи достъпът</h2>
          <div className="vstack gap-3 text-muted">
            <div><i className="bi bi-check2-circle text-success me-2" />Всеки валидатор е вързан към една public page.</div>
            <div><i className="bi bi-check2-circle text-success me-2" />Валидаторът не вижда organizer panel, workspace данни или лични заявки.</div>
            <div><i className="bi bi-check2-circle text-success me-2" />Ако го спреш и няма други активни задачи, ролята Validator се маха автоматично.</div>
          </div>
        </div>
      </div>

      <div className="groove-paper-card">
        <div className="d-flex justify-content-between gap-3 align-items-center mb-3">
          <div>
            <span className="groove-kicker">Активни достъпи</span>
            <h2 className="h4 mb-0">Валидатори по public page</h2>
          </div>
          <span className="text-muted small">{validators.filter(v => v.isActive).length} активни</span>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : validators.length === 0 ? (
          <div className="empty-state">Още няма добавени валидатори.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover groove-table align-middle">
              <thead>
                <tr>
                  <th>Потребител</th>
                  <th>Public page</th>
                  <th>Статус</th>
                  <th>Добавен</th>
                  <th className="text-end">Действия</th>
                </tr>
              </thead>
              <tbody>
                {validators.map(v => (
                  <tr key={v.id} className={!v.isActive ? 'opacity-75' : ''}>
                    <td>
                      <strong>{v.validatorUserName}</strong>
                      <div className="small text-muted">{v.validatorEmail || v.validatorPhoneNumber || 'без контакт'}</div>
                    </td>
                    <td style={{ minWidth: 240 }}>
                      <select
                        className="form-select form-select-sm"
                        value={pageSelections[v.id] ?? ''}
                        onChange={e => setPageSelections(prev => ({ ...prev, [v.id]: e.target.value }))}
                        disabled={savingId === v.id}
                      >
                        <option value="">Избери public page</option>
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                      </select>
                    </td>
                    <td>{v.isActive ? <span className="badge bg-success">Активен</span> : <span className="badge bg-secondary">Спрян</span>}</td>
                    <td>{format(new Date(v.createdAt), 'dd.MM.yyyy')}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button className="groove-button groove-button-paper groove-button--sm" onClick={() => updatePage(v.id)} disabled={savingId === v.id}>
                          <i className="bi bi-arrow-repeat" /> Запази
                        </button>
                        {v.isActive && (
                          <button className="groove-button groove-button-paper groove-button--sm text-danger" onClick={() => remove(v.id)} disabled={savingId === v.id}>
                            <i className="bi bi-x-lg" /> Спри
                          </button>
                        )}
                      </div>
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
