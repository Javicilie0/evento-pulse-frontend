'use client'

import { use, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { MediaUploadField } from '@/components/forms/MediaUploadField'

interface ProfileForm {
  displayName: string
  tagline: string
  description: string
  city: string
  avatarImageUrl: string
  coverImageUrl: string
  website: string
  phoneNumber: string
  contactEmail: string
  instagramUrl: string
  facebookUrl: string
  tikTokUrl: string
  brandColor: string
  businessWorkspaceId: string
  isDefault: boolean
}

const emptyForm: ProfileForm = {
  displayName: '',
  tagline: '',
  description: '',
  city: '',
  avatarImageUrl: '',
  coverImageUrl: '',
  website: '',
  phoneNumber: '',
  contactEmail: '',
  instagramUrl: '',
  facebookUrl: '',
  tikTokUrl: '',
  brandColor: '',
  businessWorkspaceId: '',
  isDefault: false,
}

interface Workspace { id: number; displayName: string; isDefault: boolean }

export default function OrganizerProfileEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isNew = id === 'new'
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspaceId') ?? ''
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Workspace[]>('/api/organizer/workspaces').then(r => {
      setWorkspaces(r.data)
      if (isNew && workspaceId) setForm(prev => ({ ...prev, businessWorkspaceId: workspaceId }))
    }).catch(() => {})
    if (isNew) return
    api.get<ProfileForm>(`/api/organizer/profiles/${id}`)
      .then(r => setForm({ ...emptyForm, ...r.data, businessWorkspaceId: (r.data as any).businessWorkspaceId ? String((r.data as any).businessWorkspaceId) : '' }))
      .catch(() => setError('Страницата не може да бъде заредена.'))
      .finally(() => setLoading(false))
  }, [id, isNew, workspaceId])

  function set(field: keyof ProfileForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        const res = await api.post<{ id: number }>('/api/organizer/profiles', { ...form, businessWorkspaceId: form.businessWorkspaceId ? Number(form.businessWorkspaceId) : undefined })
        router.push('/organizer/profiles')
        router.refresh()
        return res
      }
      await api.put(`/api/organizer/profiles/${id}`, { ...form, businessWorkspaceId: form.businessWorkspaceId ? Number(form.businessWorkspaceId) : undefined })
      router.push('/organizer/profiles')
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Страницата не може да бъде запазена.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Организатор</span>
          <h1 className="groove-panel-title">{isNew ? 'Нова публична страница' : 'Редакция на страница'}</h1>
        </div>
        <Link href="/organizer/profiles" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>
      </div>

      <div className="groove-paper-card">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : (
          <form onSubmit={handleSubmit} className="auth-zine-form">
            {error && <div className="auth-zine-validation" role="alert"><ul><li>{error}</li></ul></div>}
            <div className="row g-3">
              <Field label="Име *" value={form.displayName} onChange={v => set('displayName', v)} required />
              <Field label="Кратко описание" value={form.tagline} onChange={v => set('tagline', v)} />
              <Field label="Град" value={form.city} onChange={v => set('city', v)} />
              <Field label="Сайт" value={form.website} onChange={v => set('website', v)} />
              <Field label="Телефон" value={form.phoneNumber} onChange={v => set('phoneNumber', v)} />
              <Field label="Контактен имейл" value={form.contactEmail} onChange={v => set('contactEmail', v)} />
              <div className="col-md-6"><MediaUploadField label="Avatar" folder="organizers" value={form.avatarImageUrl} onChange={v => set('avatarImageUrl', v)} /></div>
              <div className="col-md-6"><MediaUploadField label="Cover" folder="organizers" value={form.coverImageUrl} onChange={v => set('coverImageUrl', v)} /></div>
              <Field label="Instagram" value={form.instagramUrl} onChange={v => set('instagramUrl', v)} />
              <Field label="Facebook" value={form.facebookUrl} onChange={v => set('facebookUrl', v)} />
              <Field label="TikTok" value={form.tikTokUrl} onChange={v => set('tikTokUrl', v)} />
              <Field label="Цвят" value={form.brandColor} onChange={v => set('brandColor', v)} />
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
                  <textarea id="description" className="form-control" rows={5} value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
              </div>
              <div className="col-12">
                <label className="d-flex align-items-center gap-2">
                  <input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} />
                  Основна страница
                </label>
              </div>
            </div>
            <div className="groove-form-actions mt-4">
              <button className="auth-zine-button auth-zine-button-red" type="submit" disabled={saving}>
                <i className="bi bi-check2" /> {saving ? 'Запазване...' : 'Запази'}
              </button>
              <Link href="/organizer/profiles" className="groove-button groove-button-paper">Отказ</Link>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="col-md-6">
      <div className="auth-zine-field">
        <label htmlFor={id}>{label}</label>
        <input id={id} className="form-control" value={value ?? ''} onChange={e => onChange(e.target.value)} required={required} />
      </div>
    </div>
  )
}
