'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { mediaUrl } from '@/lib/media'

interface Me {
  id: string
  email: string
  userName: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  bio?: string
}

export default function AccountEditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', bio: '', profileImageUrl: '' })
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
        firstName: r.data.firstName ?? '',
        lastName: r.data.lastName ?? '',
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
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Грешка при запазването.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !me) {
    return <section className="groove-app-page"><div className="text-center py-5"><div className="spinner-border text-primary" /></div></section>
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Профил</span>
          <h1 className="groove-panel-title">Редактирай профила</h1>
        </div>
        <Link href="/account" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> Назад
        </Link>
      </div>

      <div className="groove-split">
        <div className="groove-split__main">
          <div className="groove-paper-card">
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
                    <label>Първо име</label>
                    <input type="text" className="form-control" value={form.firstName}
                      onChange={e => set('firstName', e.target.value)} maxLength={100} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="auth-zine-field">
                    <label>Фамилия</label>
                    <input type="text" className="form-control" value={form.lastName}
                      onChange={e => set('lastName', e.target.value)} maxLength={100} />
                  </div>
                </div>
                <div className="col-12">
                  <div className="auth-zine-field">
                    <label>Снимка (URL)</label>
                    <input type="url" className="form-control" value={form.profileImageUrl}
                      onChange={e => set('profileImageUrl', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div className="col-12">
                  <div className="auth-zine-field">
                    <label>Биография</label>
                    <textarea className="form-control" rows={4} value={form.bio}
                      onChange={e => set('bio', e.target.value)} maxLength={500}
                      style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              <div className="groove-form-actions mt-4">
                <button type="submit" className="auth-zine-button auth-zine-button-teal" disabled={saving}>
                  <i className="bi bi-floppy" /> {saving ? 'Запазване...' : 'Запази'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <aside className="groove-split__side">
          <div className="groove-info-card">
            <div className="text-center mb-3">
              {form.profileImageUrl
                ? <img src={mediaUrl(form.profileImageUrl)} className="rounded-circle" width={80} height={80} alt="" style={{ objectFit: 'cover' }} />
                : <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto" style={{ width: 80, height: 80 }}>
                    <i className="bi bi-person fs-2 text-white" />
                  </div>}
            </div>
            <h3 className="groove-panel-title text-center mb-1">{me.userName}</h3>
            <p className="text-muted text-center small">{me.email}</p>
          </div>
        </aside>
      </div>
    </section>
  )
}
