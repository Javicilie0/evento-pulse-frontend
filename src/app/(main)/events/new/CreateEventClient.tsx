'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { MediaUploadField } from '@/components/forms/MediaUploadField'

const GENRES = [
  ['LiveMusic', 'Live музика'], ['Festival', 'Фестивал'], ['Theater', 'Театър'], ['Exhibition', 'Изложба'],
  ['Sport', 'Спорт'], ['Party', 'Парти'], ['Conference', 'Конференция'], ['Workshop', 'Уъркшоп'],
  ['Comedy', 'Комедия'], ['Cinema', 'Кино'], ['FreeEvent', 'Безплатно'], ['ForKids', 'За деца'],
  ['Techno', 'Техно'], ['House', 'Хаус'], ['Jazz', 'Джаз'], ['Other', 'Друго'],
] as const
const DAYS = [['Monday', 'Пон'], ['Tuesday', 'Вто'], ['Wednesday', 'Сря'], ['Thursday', 'Чет'], ['Friday', 'Пет'], ['Saturday', 'Съб'], ['Sunday', 'Нед']] as const

interface OrganizerProfile { id: number; displayName: string; isDefault: boolean; businessWorkspaceId?: number; workspaceName?: string }
interface Workspace { id: number; displayName: string; isDefault: boolean }
interface VenueLayout { id: number; venueName: string; name: string; seats: number; status: string }
interface LayoutTicketSection { sectionId: number; sectionName: string; colorHex: string; seatsCount: number; price: number; requiresAttendeeNames: boolean }

export default function CreateEventPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [layouts, setLayouts] = useState<VenueLayout[]>([])
  const [layoutSections, setLayoutSections] = useState<LayoutTicketSection[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['LiveMusic'])
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '', description: '', startTime: '', endTime: '', genre: 'LiveMusic',
    address: '', city: '', imageUrl: '', latitude: '', longitude: '',
    businessWorkspaceId: '', organizerProfileId: '',
    recurrenceType: 'None', recurrenceInterval: '1', recurrenceStartDate: '', recurrenceEndDate: '',
    recurrenceStartTime: '', recurrenceEndTime: '', ticketingMode: 'GeneralAdmission', venueLayoutId: '',
  })
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    const roles = (session as any)?.user?.roles as string[] | undefined
    if (!roles?.includes('Organizer') && !roles?.includes('Admin')) { router.push('/account/apply'); return }

    Promise.all([
      api.get<OrganizerProfile[]>('/api/organizer/profiles'),
      api.get<Workspace[]>('/api/organizer/workspaces').catch(() => ({ data: [] as Workspace[] })),
      api.get<VenueLayout[]>('/api/layouts').catch(() => ({ data: [] as VenueLayout[] })),
    ]).then(([profilesRes, workspacesRes, layoutsRes]) => {
      setProfiles(profilesRes.data)
      setWorkspaces(workspacesRes.data)
      setLayouts(layoutsRes.data.filter(l => l.status !== 'Archived'))
      const profile = profilesRes.data.find(p => p.isDefault) || profilesRes.data[0]
      const workspace = workspacesRes.data.find(w => w.isDefault) || workspacesRes.data[0]
      if (profile || workspace) {
        setForm(f => ({
          ...f,
          organizerProfileId: profile ? String(profile.id) : '',
          businessWorkspaceId: profile?.businessWorkspaceId ? String(profile.businessWorkspaceId) : workspace ? String(workspace.id) : '',
        }))
      }
    }).catch(() => setError('Формата не може да зареди public pages/workspaces.'))
  }, [status, session, router])

  const activeProfile = useMemo(() => profiles.find(p => String(p.id) === form.organizerProfileId), [profiles, form.organizerProfileId])
  const activeWorkspace = useMemo(() => workspaces.find(w => String(w.id) === form.businessWorkspaceId), [workspaces, form.businessWorkspaceId])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setProfile(value: string) {
    const profile = profiles.find(p => String(p.id) === value)
    setForm(f => ({ ...f, organizerProfileId: value, businessWorkspaceId: profile?.businessWorkspaceId ? String(profile.businessWorkspaceId) : f.businessWorkspaceId }))
  }

  function toggleGenre(genre: string) {
    setSelectedGenres(current => {
      const next = current.includes(genre) ? current.filter(g => g !== genre) : [...current, genre].slice(0, 5)
      set('genre', next[0] || 'Other')
      return next.length ? next : ['Other']
    })
  }

  function toggleDay(day: string) {
    setDaysOfWeek(current => current.includes(day) ? current.filter(d => d !== day) : [...current, day])
  }

  async function generateDescription() {
    if (!form.title.trim()) { setError('Въведи заглавие, за да генерирам описание.'); return }
    setAiLoading(true)
    setError('')
    try {
      const res = await api.post('/api/events/generate-description', { title: form.title, city: form.city, genre: form.genre, hints: form.description, lang: 'bg' })
      set('description', res.data.description)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'AI описанието не успя.')
    } finally {
      setAiLoading(false)
    }
  }

  async function loadLayoutSections(layoutId: string) {
    set('venueLayoutId', layoutId)
    if (!layoutId) { setLayoutSections([]); return }
    try {
      const res = await api.get<LayoutTicketSection[]>(`/api/events/layout-ticket-sections/${layoutId}`)
      setLayoutSections(res.data.map(section => ({ ...section, price: section.price || 0, requiresAttendeeNames: section.requiresAttendeeNames || false })))
    } catch {
      setLayoutSections([])
    }
  }

  function updateLayoutSection(sectionId: number, patch: Partial<LayoutTicketSection>) {
    setLayoutSections(prev => prev.map(s => s.sectionId === sectionId ? { ...s, ...patch } : s))
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
        genre: selectedGenres[0] || form.genre,
        organizerProfileId: form.organizerProfileId ? Number(form.organizerProfileId) : undefined,
        businessWorkspaceId: form.businessWorkspaceId ? Number(form.businessWorkspaceId) : undefined,
        recurrenceInterval: Number(form.recurrenceInterval || 1),
        recurrenceStartDate: form.recurrenceStartDate || undefined,
        recurrenceEndDate: form.recurrenceEndDate || undefined,
        recurrenceStartTime: form.recurrenceStartTime || undefined,
        recurrenceEndTime: form.recurrenceEndTime || undefined,
        daysOfWeek: daysOfWeek.length ? daysOfWeek : undefined,
        timeZone: 'Europe/Sofia',
        imageUrl: form.imageUrl || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        venueLayoutId: form.venueLayoutId ? Number(form.venueLayoutId) : undefined,
        layoutTicketSections: form.ticketingMode === 'GeneralAdmission' ? undefined : layoutSections,
      })
      router.push(`/events/${res.data.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Грешка при създаването.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page groove-form-shell">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Събитие</span>
          <h1>Създай нова <span>вечер</span>.</h1>
          <p>Добави детайлите, избери public page, график, жанрове и начина на продажба.</p>
        </div>
        <div className="groove-page-actions">
          <Link href="/organizer/dashboard" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Организаторско табло</Link>
        </div>
      </div>

      <div className="groove-form-panel">
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-zine-validation mb-3" role="alert"><ul><li>{error}</li></ul></div>}

          {(activeProfile || activeWorkspace) && (
            <div className="groove-note mb-3">
              <strong>Publishing context</strong>
              <span>Publishing as: {activeProfile?.displayName || 'public page'} · Payments go to: {activeWorkspace?.displayName || activeProfile?.workspaceName || 'workspace'}</span>
            </div>
          )}

          <details className="event-create-guide mb-3">
            <summary><i className="bi bi-info-circle" /><span>Кратко ръководство за организатори</span></summary>
            <div className="event-create-guide__grid">
              <section><strong>График</strong><p>Еднократно е за една дата. Повтарящо се е за серии с дни от седмицата.</p></section>
              <section><strong>Билети</strong><p>По билет е за свободен вход. По layout създава билети автоматично по сектор.</p></section>
              <section><strong>Layout</strong><p>Секторите с места носят бройките. Сцена и надписи са само визуални.</p></section>
            </div>
          </details>

          <div className="mb-3">
            <label className="form-label">Public page *</label>
            <select className="form-select" value={form.organizerProfileId} onChange={e => setProfile(e.target.value)} required>
              <option value="">-- Избери публична страница --</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.displayName}{p.isDefault ? ' (по подразбиране)' : ''}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Заглавие *</label>
            <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200} />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-end gap-2">
              <label className="form-label mb-0">Описание</label>
              <button type="button" className="groove-button groove-button-paper btn-sm" onClick={generateDescription} disabled={aiLoading}><i className="bi bi-stars" /> {aiLoading ? 'Генерирам...' : 'Генерирай с AI'}</button>
            </div>
            <textarea className="form-control mt-1" rows={4} value={form.description} onChange={e => set('description', e.target.value)} maxLength={5000} />
          </div>

          <div className="groove-form-grid">
            <div className="mb-3">
              <label className="form-label">Град *</label>
              <input className="form-control" value={form.city} onChange={e => set('city', e.target.value)} required placeholder="София, Пловдив, Русе..." />
            </div>
            <div className="mb-3">
              <label className="form-label">Адрес *</label>
              <input className="form-control" value={form.address} onChange={e => set('address', e.target.value)} required placeholder="Започни да пишеш адрес или място..." />
              <div className="form-text">Следваща стъпка: връщам и autocomplete/map picker-а 1:1.</div>
            </div>
          </div>

          <section className="event-schedule-panel mb-3">
            <span className="groove-kicker">График</span>
            <h3 className="h5 mt-2">Кога се случва</h3>
            <div className="event-choice-grid event-choice-grid--compact mt-3">
              <label className="event-choice-card"><input type="radio" checked={form.recurrenceType === 'None'} onChange={() => set('recurrenceType', 'None')} /><span><strong>Еднократно</strong><span>Една дата и един начален/краен час.</span></span></label>
              <label className="event-choice-card"><input type="radio" checked={form.recurrenceType !== 'None'} onChange={() => set('recurrenceType', 'Weekly')} /><span><strong>Повтарящо се</strong><span>Избери период, дни от седмицата и часове.</span></span></label>
            </div>
            <div className="groove-form-grid mt-3">
              <div className="mb-3"><label className="form-label">Начало *</label><input type="datetime-local" className="form-control" value={form.startTime} onChange={e => set('startTime', e.target.value)} required /></div>
              <div className="mb-3"><label className="form-label">Край *</label><input type="datetime-local" className="form-control" value={form.endTime} onChange={e => set('endTime', e.target.value)} required /></div>
            </div>
            {form.recurrenceType !== 'None' && (
              <div className="event-recurring-fields">
                <div className="event-repeat-summary"><span>Повтаря се всяка</span><input className="form-control" type="number" min="1" value={form.recurrenceInterval} onChange={e => set('recurrenceInterval', e.target.value)} /><span>седмица в:</span></div>
                <div className="event-weekday-list mb-3">{DAYS.map(([value, label]) => <label key={value}><input type="checkbox" checked={daysOfWeek.includes(value)} onChange={() => toggleDay(value)} /><span>{label}</span></label>)}</div>
                <div className="groove-form-grid">
                  <div className="mb-3"><label className="form-label">Начална дата</label><input type="date" className="form-control" value={form.recurrenceStartDate} onChange={e => set('recurrenceStartDate', e.target.value)} /></div>
                  <div className="mb-3"><label className="form-label">Крайна дата</label><input type="date" className="form-control" value={form.recurrenceEndDate} onChange={e => set('recurrenceEndDate', e.target.value)} /></div>
                  <div className="mb-3"><label className="form-label">Начален час</label><input type="time" className="form-control" value={form.recurrenceStartTime} onChange={e => set('recurrenceStartTime', e.target.value)} /></div>
                  <div className="mb-3"><label className="form-label">Краен час</label><input type="time" className="form-control" value={form.recurrenceEndTime} onChange={e => set('recurrenceEndTime', e.target.value)} /></div>
                </div>
              </div>
            )}
          </section>

          <div className="mb-3">
            <div className="event-genre-compact">
              <div><label className="form-label mb-1">Жанрове</label><p className="event-genre-compact__hint">Избери до 5. Първият избран е основната категория.</p></div>
              <div className="event-genre-picker event-genre-picker--compact">
                {GENRES.map(([value, label]) => <label key={value} className={`event-genre-option ${selectedGenres.includes(value) ? 'is-selected' : ''}`}><input type="checkbox" checked={selectedGenres.includes(value)} onChange={() => toggleGenre(value)} /><span>{label}</span></label>)}
              </div>
            </div>
          </div>

          <MediaUploadField label="Качи снимка" folder="events" value={form.imageUrl} onChange={url => set('imageUrl', url)} />

          <section className="event-ticketing-panel mb-3">
            <span className="groove-kicker">Билети</span>
            <h3 className="h5 mt-2">Как се продават местата</h3>
            <div className="event-choice-grid event-choice-grid--compact mt-3">
              <label className="event-choice-card"><input type="radio" checked={form.ticketingMode === 'GeneralAdmission'} onChange={() => set('ticketingMode', 'GeneralAdmission')} /><span><strong>По билет</strong><span>Без схема. След създаване добавяш типове билети и бройки ръчно.</span></span></label>
              <label className="event-choice-card"><input type="radio" checked={form.ticketingMode !== 'GeneralAdmission'} onChange={() => set('ticketingMode', 'SeatedLayout')} /><span><strong>По layout</strong><span>Избираш схема и задаваш цена директно по цвят/сектор.</span></span></label>
            </div>
            {form.ticketingMode !== 'GeneralAdmission' && (
              <>
                <div className="groove-form-grid mt-3">
                  <div className="mb-3"><label className="form-label">Layout</label><select className="form-select" value={form.venueLayoutId} onChange={e => loadLayoutSections(e.target.value)} required><option value="">-- Избери layout --</option>{layouts.map(l => <option key={l.id} value={l.id}>{l.venueName} - {l.name} ({l.seats} места)</option>)}</select></div>
                  <div className="mb-3 d-flex align-items-end"><Link href="/layouts/editor" className="groove-button groove-button-paper w-100"><i className="bi bi-grid-3x3-gap" /> Създай layout</Link></div>
                </div>
                <section className="event-layout-ticket-builder">
                  <div className="event-layout-ticket-builder__head"><div><span className="groove-kicker">Цени по цвят</span><h4>Въведи цена за всеки цвят места</h4><p>Името и бройката се вземат от сектора. Създават се нормални билети автоматично.</p></div><span>{layoutSections.reduce((sum, s) => sum + s.seatsCount, 0)} места</span></div>
                  <div className="event-layout-ticket-builder__rows">
                    {layoutSections.length === 0 ? <p className="event-layout-ticket-builder__empty">Избери layout, за да заредим секторите.</p> : layoutSections.map(section => (
                      <label key={section.sectionId} className="event-layout-ticket-row">
                        <span className="event-layout-ticket-row__dot" style={{ background: section.colorHex }} />
                        <span className="event-layout-ticket-row__meta"><strong>{section.sectionName}</strong><small>{section.seatsCount} места</small></span>
                        <span className="event-layout-ticket-row__field"><small>Цена</small><input type="number" step="0.01" min="0" value={section.price} onChange={e => updateLayoutSection(section.sectionId, { price: Number(e.target.value) })} /></span>
                        <span className="event-layout-ticket-row__names"><input type="checkbox" checked={section.requiresAttendeeNames} onChange={e => updateLayoutSection(section.sectionId, { requiresAttendeeNames: e.target.checked })} /><small>Изисквай имена</small></span>
                      </label>
                    ))}
                  </div>
                </section>
              </>
            )}
          </section>

          <div className="groove-form-actions">
            <button type="submit" className="groove-button groove-button-dark" disabled={loading}><i className="bi bi-check-lg" /> {loading ? 'Създаване...' : 'Създай'}</button>
            <Link href="/" className="groove-button groove-button-paper">Отказ</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
