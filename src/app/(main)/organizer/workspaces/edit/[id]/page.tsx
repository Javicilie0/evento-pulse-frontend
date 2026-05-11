'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

const empty = {
  displayName: '',
  legalName: '',
  companyNumber: '',
  billingEmail: '',
  phoneNumber: '',
  address: '',
  city: '',
  country: 'Bulgaria',
  isDefault: false,
}

export default function WorkspaceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isNew = id === 'new'
  const router = useRouter()
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isNew) return
    api.get(`/api/organizer/workspaces/${id}`)
      .then(r => setForm({ ...empty, ...r.data }))
      .catch(() => setError('Workspace не може да бъде зареден.'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  function set(field: keyof typeof empty, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isNew) await api.post('/api/organizer/workspaces', form)
      else await api.put(`/api/organizer/workspaces/${id}`, form)
      router.push('/organizer/workspaces')
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Workspace не може да бъде запазен.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Workspace</span>
          <h1 className="groove-panel-title">{isNew ? 'Нов workspace' : 'Редакция на workspace'}</h1>
        </div>
        <Link href="/organizer/workspaces" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Назад</Link>
      </div>
      <div className="groove-paper-card">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : (
          <form onSubmit={submit} className="auth-zine-form">
            {error && <div className="auth-zine-validation" role="alert"><ul><li>{error}</li></ul></div>}
            <div className="row g-3">
              <Field label="Име *" value={form.displayName} onChange={v => set('displayName', v)} required />
              <Field label="Юридическо име *" value={form.legalName} onChange={v => set('legalName', v)} required />
              <Field label="ЕИК/номер" value={form.companyNumber} onChange={v => set('companyNumber', v)} />
              <Field label="Billing email" value={form.billingEmail} onChange={v => set('billingEmail', v)} />
              <Field label="Телефон" value={form.phoneNumber} onChange={v => set('phoneNumber', v)} />
              <Field label="Адрес" value={form.address} onChange={v => set('address', v)} />
              <Field label="Град" value={form.city} onChange={v => set('city', v)} />
              <Field label="Държава" value={form.country} onChange={v => set('country', v)} />
              <div className="col-12"><label className="d-flex gap-2"><input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} /> Основен workspace</label></div>
            </div>
            <div className="groove-form-actions mt-4">
              <button className="auth-zine-button auth-zine-button-red" disabled={saving}><i className="bi bi-check2" /> {saving ? 'Запазване...' : 'Запази'}</button>
              <Link href="/organizer/workspaces" className="groove-button groove-button-paper">Отказ</Link>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <div className="col-md-6">
      <div className="auth-zine-field">
        <label>{label}</label>
        <input className="form-control" value={value ?? ''} onChange={e => onChange(e.target.value)} required={required} />
      </div>
    </div>
  )
}
