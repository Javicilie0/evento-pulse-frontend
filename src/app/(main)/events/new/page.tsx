'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { MediaUploadField } from '@/components/forms/MediaUploadField'

const GENRES = [
  'LiveMusic', 'Festival', 'Theater', 'Exhibition', 'Sport',
  'Party', 'Conference', 'Workshop', 'Comedy', 'Cinema',
  'FreeEvent', 'ForKids', 'Techno', 'House', 'Jazz', 'Other',
]

const GENRE_LABELS: Record<string, string> = {
  LiveMusic: 'Live музика', Festival: 'Фестивал', Theater: 'Театър',
  Exhibition: 'Изложба', Sport: 'Спорт', Party: 'Парти',
  Conference: 'Конференция', Workshop: 'Уъркшоп', Comedy: 'Комедия',
  Cinema: 'Кино', FreeEvent: 'Безплатно', ForKids: 'За деца',
  Techno: 'Техно', House: 'Хаус', Jazz: 'Джаз', Other: 'Друго',
}

interface OrganizerProfile { id: number; displayName: string; isDefault: boolean; businessWorkspaceId?: number }
interface Workspace { id: number; displayName: string; isDefault: boolean }

export default function CreateEventPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    genre: 'LiveMusic',
    address: '',
    city: '',
    imageUrl: '',
    businessWorkspaceId: '',
    organizerProfileId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    const roles = (session as any)?.user?.roles as string[] | undefined
    if (!roles?.includes('Organizer') && !roles?.includes('Admin')) {
      router.push('/account/apply')
      return
    }
    api.get<OrganizerProfile[]>('/api/organizer/profiles').then(r => {
      setProfiles(r.data)
      const def = r.data.find(p => p.isDefault)
      if (def) setForm(f => ({ ...f, organizerProfileId: String(def.id), businessWorkspaceId: def.businessWorkspaceId ? String(def.businessWorkspaceId) : f.businessWorkspaceId }))
    })
    api.get<Workspace[]>('/api/organizer/workspaces').then(r => {
      setWorkspaces(r.data)
      const def = r.data.find(w => w.isDefault)
      if (def) setForm(f => ({ ...f, businessWorkspaceId: f.businessWorkspaceId || String(def.id) }))
    })
  }, [status, session, router])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/events', {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        organizerProfileId: form.organizerProfileId ? Number(form.organizerProfileId) : undefined,
        businessWorkspaceId: form.businessWorkspaceId ? Number(form.businessWorkspaceId) : undefined,
        imageUrl: form.imageUrl || undefined,
      })
      router.push(`/events/${res.data.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Грешка при създаването.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-red">Организатор</span>
          <h1 data-i18n-html="event.create.title">Създай <span>събитие</span>.</h1>
          <p className="groove-page-hero__lead">Попълни формата и изпрати за одобрение.</p>
        </div>
        <div className="groove-page-actions">
          <Link href="/organizer/events" className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Назад
          </Link>
        </div>
      </div>

      <div className="groove-paper-card mt-4">
        <form onSubmit={handleSubmit} className="auth-zine-form">
          {error && (
            <div className="auth-zine-validation" role="alert">
              <ul><li>{error}</li></ul>
            </div>
          )}

          <div className="row g-3">
            <div className="col-12">
              <div className="auth-zine-field">
                <label htmlFor="title">Заглавие *</label>
                <input id="title" type="text" className="form-control" value={form.title}
                  onChange={e => set('title', e.target.value)} required maxLength={200} />
              </div>
            </div>

            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="startTime">Начало *</label>
                <input id="startTime" type="datetime-local" className="form-control" value={form.startTime}
                  onChange={e => set('startTime', e.target.value)} required />
              </div>
            </div>

            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="endTime">Край *</label>
                <input id="endTime" type="datetime-local" className="form-control" value={form.endTime}
                  onChange={e => set('endTime', e.target.value)} required />
              </div>
            </div>

            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="address">Адрес *</label>
                <input id="address" type="text" className="form-control" value={form.address}
                  onChange={e => set('address', e.target.value)} required maxLength={300} />
              </div>
            </div>

            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="city">Град *</label>
                <input id="city" type="text" className="form-control" value={form.city}
                  onChange={e => set('city', e.target.value)} required maxLength={100} />
              </div>
            </div>

            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="genre">Жанр *</label>
                <select id="genre" className="form-select" value={form.genre} onChange={e => set('genre', e.target.value)}>
                  {GENRES.map(g => (
                    <option key={g} value={g}>{GENRE_LABELS[g] ?? g}</option>
                  ))}
                </select>
              </div>
            </div>

            {profiles.length > 0 && (
              <div className="col-md-6">
                <div className="auth-zine-field">
                  <label htmlFor="profile">Организаторска страница</label>
                  <select id="profile" className="form-select" value={form.organizerProfileId}
                    onChange={e => set('organizerProfileId', e.target.value)}>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.displayName}{p.isDefault ? ' (по подразбиране)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {workspaces.length > 0 && (
              <div className="col-md-6">
                <div className="auth-zine-field">
                  <label htmlFor="workspace">Workspace</label>
                  <select id="workspace" className="form-select" value={form.businessWorkspaceId}
                    onChange={e => set('businessWorkspaceId', e.target.value)}>
                    <option value="">Без workspace</option>
                    {workspaces.map(w => (
                      <option key={w.id} value={w.id}>{w.displayName}{w.isDefault ? ' (основен)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="col-12">
              <MediaUploadField label="Снимка" folder="events" value={form.imageUrl} onChange={url => set('imageUrl', url)} />
            </div>

            <div className="col-12">
              <div className="auth-zine-field">
                <label htmlFor="description">Описание</label>
                <textarea id="description" className="form-control" rows={6} value={form.description}
                  onChange={e => set('description', e.target.value)} maxLength={5000}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          <div className="groove-form-actions mt-4">
            <button type="submit" className="auth-zine-button auth-zine-button-red" disabled={loading}>
              <i className="bi bi-send" /> {loading ? 'Изпращане...' : 'Изпрати за одобрение'}
            </button>
            <Link href="/organizer/events" className="groove-button groove-button-paper">Отказ</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
