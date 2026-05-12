'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { mediaUrl } from '@/lib/media'
import { MediaUploadField } from '@/components/forms/MediaUploadField'

interface Me {
  id: string
  email: string
  userName: string
  phoneNumber?: string
  profileImageUrl?: string
  bio?: string
}

export default function AccountEditPage() {
  const { status } = useSession()
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [form, setForm] = useState({ userName: '', email: '', phoneNumber: '', bio: '', profileImageUrl: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    api.get<Me>('/api/auth/me').then(r => {
      setMe(r.data)
      setForm({
        userName: r.data.userName ?? '',
        email: r.data.email ?? '',
        phoneNumber: r.data.phoneNumber ?? '',
        bio: r.data.bio ?? '',
        profileImageUrl: r.data.profileImageUrl ?? '',
      })
    }).finally(() => setLoading(false))
  }, [status, router])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await api.put('/api/auth/me', form)
      setSuccess(true)
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } }
      setError(apiError.response?.data?.error || 'Грешка при запазването.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !me) {
    return <section className="groove-app-page"><div className="text-center py-5"><div className="spinner-border text-primary" /></div></section>
  }

  return (
    <section className="groove-app-page groove-form-shell groove-form-shell-narrow">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Профил</span>
          <h1>Редакция на <span>акаунта</span>.</h1>
          <p>Обнови потребителското име, контактите и кратката си биография.</p>
        </div>
        <div className="groove-page-actions">
          <Link href="/account" className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Обратно към профила
          </Link>
        </div>
      </div>

      <div className="groove-form-panel">
            <form onSubmit={handleSubmit} className="auth-zine-form">
              {success && (
                <div className="alert alert-success"><i className="bi bi-check-circle me-2" />Профилът е запазен.</div>
              )}
              {error && (
                <div className="auth-zine-validation" role="alert"><ul><li>{error}</li></ul></div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="auth-zine-field">
                    <label>User name</label>
                    <input type="text" className="form-control" value={form.userName}
                      onChange={e => set('userName', e.target.value)} autoComplete="username" required maxLength={100} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="auth-zine-field">
                    <label>Email</label>
                    <input type="email" className="form-control" value={form.email}
                      onChange={e => set('email', e.target.value)} autoComplete="email" readOnly />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="auth-zine-field">
                    <label>Phone number</label>
                    <input type="tel" className="form-control" value={form.phoneNumber}
                      onChange={e => set('phoneNumber', e.target.value)} autoComplete="tel" />
                  </div>
                </div>
                <div className="col-md-6">
                  <MediaUploadField
                    label="Profile image"
                    folder="profiles"
                    value={form.profileImageUrl}
                    onChange={url => set('profileImageUrl', url)}
                  />
                </div>
                <div className="col-12">
                  <div className="auth-zine-field">
                    <label>Bio</label>
                    <textarea className="form-control" rows={4} value={form.bio}
                      onChange={e => set('bio', e.target.value)} maxLength={500}
                      style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              <div className="groove-form-actions mt-4">
                <button type="submit" className="auth-zine-button auth-zine-button-teal" disabled={saving}>
                  <i className="bi bi-check-lg" /> {saving ? 'Запазване...' : 'Запази промените'}
                </button>
                <Link href="/account" className="groove-button groove-button-paper">Отказ</Link>
              </div>
            </form>

        {form.profileImageUrl && (
          <div className="mt-3">
            <img src={mediaUrl(form.profileImageUrl)} alt="Current profile" style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: '50%' }} />
          </div>
        )}
      </div>
    </section>
  )
}
