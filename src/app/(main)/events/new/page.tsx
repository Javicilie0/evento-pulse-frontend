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
interface VenueLayout { id: number; venueName: string; name: string; seats: number; status: string }

export default function CreateEventPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [layouts, setLayouts] = useState<VenueLayout[]>([])
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
    recurrenceType: 'None',
    recurrenceInterval: '1',
    recurrenceStartDate: '',
    recurrenceEndDate: '',
    ticketingMode: 'GeneralAdmission',
    venueLayoutId: '',
  })
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
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
    api.get<VenueLayout[]>('/api/layouts').then(r => setLayouts(r.data.filter(l => l.status !== 'Archived'))).catch(() => {})
  }, [status, session, router])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setProfile(value: string) {
    const profile = profiles.find(p => String(p.id) === value)
    setForm(f => ({
      ...f,
      organizerProfileId: value,
      businessWorkspaceId: profile?.businessWorkspaceId ? String(profile.businessWorkspaceId) : f.businessWorkspaceId,
    }))
  }

  async function generateDescription() {
    if (!form.title.trim()) {
      setError('Въведи заглавие, за да генерирам описание.')
      return
    }
    setAiLoading(true)
    setError('')
    try {
      const res = await api.post('/api/events/generate-description', {
        title: form.title,
        city: form.city,
        genre: form.genre,
        hints: form.description,
        lang: 'bg',
      })
      set('description', res.data.description)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'AI описанието не успя.')
    } finally {
      setAiLoading(false)
    }
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
        recurrenceType: form.recurrenceType,
        recurrenceInterval: Number(form.recurrenceInterval || 1),
        recurrenceStartDate: form.recurrenceStartDate || undefined,
        recurrenceEndDate: form.recurrenceEndDate || undefined,
        imageUrl: form.imageUrl || undefined,
        ticketingMode: form.ticketingMode,
        venueLayoutId: form.venueLayoutId ? Number(form.venueLayoutId) : undefined,
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
                    onChange={e => setProfile(e.target.value)} required>
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

            <div className="col-md-6">
              <div className="auth-zine-field">
                <label htmlFor="ticketingMode">Билети и места</label>
                <select id="ticketingMode" className="form-select" value={form.ticketingMode} onChange={e => set('ticketingMode', e.target.value)}>
                  <option value="GeneralAdmission">Свободен вход / общи билети</option>
                  <option value="SeatedLayout">Seating layout</option>
                </select>
              </div>
            </div>

            {form.ticketingMode !== 'GeneralAdmission' && (
              <div className="col-md-6">
                <div className="auth-zine-field">
                  <label htmlFor="venueLayoutId">Layout</label>
                  <select id="venueLayoutId" className="form-select" value={form.venueLayoutId} onChange={e => set('venueLayoutId', e.target.value)} required>
                    <option value="">Избери layout</option>
                    {layouts.map(l => <option key={l.id} value={l.id}>{l.venueName} - {l.name} ({l.seats} места)</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="col-12">
              <MediaUploadField label="Снимка" folder="events" value={form.imageUrl} onChange={url => set('imageUrl', url)} />
            </div>

            <div className="col-md-4">
              <div className="auth-zine-field">
                <label htmlFor="recurrenceType">Повторение</label>
                <select id="recurrenceType" className="form-select" value={form.recurrenceType} onChange={e => set('recurrenceType', e.target.value)}>
                  <option value="None">Еднократно</option>
                  <option value="Daily">Всеки ден</option>
                  <option value="Weekly">Всяка седмица</option>
                </select>
              </div>
            </div>
            {form.recurrenceType !== 'None' && (
              <>
                <div className="col-md-4"><div className="auth-zine-field"><label>Интервал</label><input type="number" min="1" max="365" className="form-control" value={form.recurrenceInterval} onChange={e => set('recurrenceInterval', e.target.value)} /></div></div>
                <div className="col-md-4"><div className="auth-zine-field"><label>Край на серията</label><input type="date" className="form-control" value={form.recurrenceEndDate} onChange={e => set('recurrenceEndDate', e.target.value)} /></div></div>
              </>
            )}

            <div className="col-12">
              <div className="auth-zine-field">
                <label htmlFor="description">Описание</label>
                <textarea id="description" className="form-control" rows={6} value={form.description}
                  onChange={e => set('description', e.target.value)} maxLength={5000}
                  style={{ resize: 'vertical' }} />
              </div>
              <button type="button" className="groove-button groove-button-paper mt-2" onClick={generateDescription} disabled={aiLoading}>
                <i className="bi bi-stars" /> {aiLoading ? 'Генерирам...' : 'AI описание'}
              </button>
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
