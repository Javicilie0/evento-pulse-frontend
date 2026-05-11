'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

function LayoutEditorInner() {
  const id = useSearchParams().get('id')
  const router = useRouter()
  const [form, setForm] = useState({ venueName: '', name: '', status: 'Draft' })
  const [sections, setSections] = useState<any[]>([])
  const [seats, setSeats] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.get(`/api/layouts/${id}`).then(r => {
      setForm({ venueName: r.data.venueName, name: r.data.name, status: r.data.status })
      setSections(r.data.sections ?? [])
      setSeats(r.data.seats ?? [])
    }).catch(() => setError('Схемата не може да бъде заредена.'))
  }, [id])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (id) await api.put(`/api/layouts/${id}`, form)
      else {
        const res = await api.post('/api/layouts', form)
        router.push(`/layouts/editor?id=${res.data.id}`)
        return
      }
      router.push('/layouts')
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Схемата не може да бъде запазена.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div><span className="groove-kicker">Layouts</span><h1 className="groove-panel-title">{id ? 'Редакция на схема' : 'Нова схема'}</h1></div>
        <Link href="/layouts" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>
      </div>
      <div className="groove-paper-card">
        <form onSubmit={submit} className="auth-zine-form">
          {error && <div className="auth-zine-validation"><ul><li>{error}</li></ul></div>}
          <div className="row g-3">
            <div className="col-md-6"><div className="auth-zine-field"><label>Зала *</label><input className="form-control" value={form.venueName} onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))} required /></div></div>
            <div className="col-md-6"><div className="auth-zine-field"><label>Име на схема *</label><input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div></div>
            <div className="col-md-6"><div className="auth-zine-field"><label>Статус</label><select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>Draft</option><option>Active</option><option>Archived</option></select></div></div>
          </div>
          <div className="groove-form-actions mt-4">
            <button className="auth-zine-button auth-zine-button-red" disabled={saving}><i className="bi bi-check2" /> {saving ? 'Запазване...' : 'Запази'}</button>
          </div>
        </form>
      </div>
      {id && (
        <div className="groove-paper-card mt-4">
          <h2 className="groove-panel-title">Преглед</h2>
          <p className="groove-panel-intro">{sections.length} секции · {seats.length} места</p>
          <div style={{ position: 'relative', minHeight: 360, border: '1px solid #e5e7ef', borderRadius: 8, overflow: 'hidden' }}>
            {sections.map(s => <div key={s.id} title={s.name} style={{ position: 'absolute', left: s.x, top: s.y, width: s.width || 120, height: s.height || 80, background: s.colorHex || '#2456ff', opacity: .18, border: `2px solid ${s.colorHex || '#2456ff'}`, borderRadius: 8, padding: 8 }}>{s.name}</div>)}
            {seats.slice(0, 600).map(seat => <span key={seat.id} title={seat.label || `${seat.row}${seat.number}`} style={{ position: 'absolute', left: seat.x, top: seat.y, width: 12, height: 12, borderRadius: 999, background: seat.status === 'Blocked' ? '#94a3b8' : '#111827' }} />)}
          </div>
        </div>
      )}
    </section>
  )
}

export default function LayoutEditorPage() {
  return <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" /></div>}><LayoutEditorInner /></Suspense>
}
