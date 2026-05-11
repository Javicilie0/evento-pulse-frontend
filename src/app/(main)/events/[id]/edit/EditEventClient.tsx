'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { EventDetails } from '@/types/api'

const GENRES = [
  'LiveMusic', 'Festival', 'Theater', 'Exhibition', 'Sport',
  'Party', 'Conference', 'Workshop', 'Comedy', 'Cinema',
  'FreeEvent', 'ForKids', 'Techno', 'House', 'Jazz', 'Other',
]

const GENRE_LABELS: Record<string, string> = {
  LiveMusic: 'Live музика',
  Festival: 'Фестивал',
  Theater: 'Театър',
  Exhibition: 'Изложба',
  Sport: 'Спорт',
  Party: 'Парти',
  Conference: 'Конференция',
  Workshop: 'Уъркшоп',
  Comedy: 'Комедия',
  Cinema: 'Кино',
  FreeEvent: 'Безплатно',
  ForKids: 'За деца',
  Techno: 'Техно',
  House: 'Хаус',
  Jazz: 'Джаз',
  Other: 'Друго',
}

function toLocalInput(value: string) {
  const d = new Date(value)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

interface OrganizerProfile { id: number; displayName: string; isDefault: boolean; businessWorkspaceId?: number }
interface Workspace { id: number; displayName: string; isDefault: boolean }

export function EditEventClient({ event }: { event: EventDetails }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: event.title ?? '',
    description: event.description ?? '',
    startTime: toLocalInput(event.startTime),
    endTime: toLocalInput(event.endTime),
    genre: event.genre ?? 'Other',
    address: event.address ?? '',
    city: event.city ?? '',
    imageUrl: event.imageUrl ?? '',
    organizerProfileId: event.organizerProfileId ? String(event.organizerProfileId) : '',
    businessWorkspaceId: event.businessWorkspaceId ? String(event.businessWorkspaceId) : '',
  })
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    api.get<OrganizerProfile[]>('/api/organizer/profiles').then(r => setProfiles(r.data)).catch(() => {})
    api.get<Workspace[]>('/api/organizer/workspaces').then(r => setWorkspaces(r.data)).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.put(`/api/events/${event.id}`, {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        organizerProfileId: form.organizerProfileId ? Number(form.organizerProfileId) : undefined,
        businessWorkspaceId: form.businessWorkspaceId ? Number(form.businessWorkspaceId) : undefined,
        imageUrl: form.imageUrl || undefined,
      })
      router.push(`/events/${event.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Грешка при запазването.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-red">Организатор</span>
          <h1>Редакция <span>на събитие</span>.</h1>
          <p className="groove-page-hero__lead">Промените се пазят през новото API и събитието минава през одобрение.</p>
        </div>
        <div className="groove-page-actions">
          <Link href={`/events/${event.id}`} className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Назад
          </Link>
        </div>
      </div>

      <div className="groove-paper-card mt-4">
        <form onSubmit={handleSubmit} className="auth-zine-form">
          {error && <div className="auth-zine-validation" role="alert"><ul><li>{error}</li></ul></div>}
          <div className="row g-3">
            <div className="col-12">
              <div className="auth-zine-field">
                <label htmlFor="title">Заглавие *</label>
                <input id="title" className="form-control" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="startTime">Начало *</label>
                <input id="startTime" type="datetime-local" className="form-control" value={form.startTime} onChange={e => set('startTime', e.target.value)} required />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="endTime">Край *</label>
                <input id="endTime" type="datetime-local" className="form-control" value={form.endTime} onChange={e => set('endTime', e.target.value)} required />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="address">Адрес *</label>
                <input id="address" className="form-control" value={form.address} onChange={e => set('address', e.target.value)} required maxLength={300} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="city">Град *</label>
                <input id="city" className="form-control" value={form.city} onChange={e => set('city', e.target.value)} required maxLength={100} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="genre">Жанр *</label>
                <select id="genre" className="form-select" value={form.genre} onChange={e => set('genre', e.target.value)}>
                  {GENRES.map(g => <option key={g} value={g}>{GENRE_LABELS[g] ?? g}</option>)}
                </select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="imageUrl">URL на снимка</label>
                <input id="imageUrl" type="url" className="form-control" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." />
              </div>
            </div>
            {profiles.length > 0 && (
              <div className="col-md-6">
                <div className="auth-zine-field">
                  <label htmlFor="profile">Public page</label>
                  <select id="profile" className="form-select" value={form.organizerProfileId} onChange={e => set('organizerProfileId', e.target.value)}>
                    <option value="">Без public page</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                  </select>
                </div>
              </div>
            )}
            {workspaces.length > 0 && (
              <div className="col-md-6">
                <div className="auth-zine-field">
                  <label htmlFor="workspace">Workspace</label>
                  <select id="workspace" className="form-select" value={form.businessWorkspaceId} onChange={e => set('businessWorkspaceId', e.target.value)}>
                    <option value="">Без workspace</option>
                    {workspaces.map(w => <option key={w.id} value={w.id}>{w.displayName}{w.isDefault ? ' (основен)' : ''}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className="col-12">
              <div className="auth-zine-field">
                <label htmlFor="description">Описание</label>
                <textarea id="description" className="form-control" rows={6} value={form.description} onChange={e => set('description', e.target.value)} maxLength={5000} />
              </div>
            </div>
          </div>
          <div className="groove-form-actions mt-4">
            <button type="submit" className="auth-zine-button auth-zine-button-red" disabled={loading}>
              <i className="bi bi-check2" /> {loading ? 'Запазване...' : 'Запази'}
            </button>
            <Link href={`/events/${event.id}`} className="groove-button groove-button-paper">Отказ</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
