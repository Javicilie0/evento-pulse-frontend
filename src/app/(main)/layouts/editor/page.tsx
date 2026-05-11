'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

type SectionType = 'Seated' | 'Standing' | 'VIP' | 'Table'
type Seat = { row: string; number: string; label?: string; x: number; y: number; radius: number; capacity: number; seatType?: string; status?: string }
type LayoutSection = {
  clientId: string
  name: string
  floorId: string
  floorName: string
  type: SectionType
  shape: string
  capacity: number
  priceModifier: number
  colorHex: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  seats: Seat[]
}
type LayoutJson = { canvasWidth: number; canvasHeight: number; floors: Array<{ clientId: string; name: string }>; sections: LayoutSection[] }

const emptyLayout = (): LayoutJson => ({
  canvasWidth: 1200,
  canvasHeight: 820,
  floors: [{ clientId: 'floor-1', name: 'Партер' }],
  sections: [
    { clientId: 'stage-1', name: 'СЦЕНА', floorId: 'floor-1', floorName: 'Партер', type: 'Seated', shape: 'Stage', capacity: 0, priceModifier: 0, colorHex: '#e5e7eb', x: 330, y: 54, width: 520, height: 118, rotation: 0, seats: [] },
  ],
})

function gridSeats(rows: number, cols: number, startX: number, startY: number) {
  const seats: Seat[] = []
  for (let r = 0; r < rows; r++) {
    const row = String.fromCharCode(65 + r)
    for (let c = 0; c < cols; c++) {
      seats.push({ row, number: String(c + 1), label: `${row}${c + 1}`, x: startX + c * 34, y: startY + r * 34, radius: 11, capacity: 1, seatType: 'Standard', status: 'Active' })
    }
  }
  return seats
}

function LayoutEditorInner() {
  const id = useSearchParams().get('id')
  const router = useRouter()
  const [form, setForm] = useState({ venueName: 'Основна зала', name: 'Стандартна схема', status: 'Active' })
  const [layout, setLayout] = useState<LayoutJson>(emptyLayout)
  const [aiPrompt, setAiPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.get(`/api/layouts/${id}`).then(r => {
      setForm({ venueName: r.data.venueName, name: r.data.name, status: r.data.status })
      if (r.data.layoutJson) setLayout(JSON.parse(r.data.layoutJson))
    }).catch(() => setError('Схемата не може да бъде заредена.'))
  }, [id])

  const stats = useMemo(() => ({
    sections: layout.sections.filter(s => s.shape !== 'Stage' && s.shape !== 'Label').length,
    seats: layout.sections.reduce((sum, section) => sum + section.seats.length, 0),
    capacity: layout.sections.reduce((sum, section) => sum + (section.seats.length || section.capacity || 0), 0),
  }), [layout])

  function addSection(type: SectionType) {
    setLayout(current => {
      const index = current.sections.length
      const seated = type === 'Seated' || type === 'VIP'
      const section: LayoutSection = {
        clientId: `section-${Date.now()}`,
        name: type === 'VIP' ? 'VIP сектор' : type === 'Standing' ? 'Правостоящи' : type === 'Table' ? 'Маси' : `Сектор ${index}`,
        floorId: 'floor-1',
        floorName: 'Партер',
        type,
        shape: type === 'Table' ? 'Circle' : 'Rounded',
        capacity: seated ? 48 : 160,
        priceModifier: type === 'VIP' ? 20 : 0,
        colorHex: type === 'VIP' ? '#f59e0b' : type === 'Standing' ? '#22c55e' : type === 'Table' ? '#0d9488' : '#2456ff',
        x: 120 + (index % 3) * 280,
        y: 240 + Math.floor(index / 3) * 190,
        width: type === 'Table' ? 180 : 240,
        height: type === 'Table' ? 180 : 150,
        rotation: 0,
        seats: seated ? gridSeats(4, 12, 18, 34) : [],
      }
      return { ...current, sections: [...current.sections, section] }
    })
  }

  function updateSection(clientId: string, patch: Partial<LayoutSection>) {
    setLayout(current => ({ ...current, sections: current.sections.map(s => s.clientId === clientId ? { ...s, ...patch } : s) }))
  }

  function removeSection(clientId: string) {
    setLayout(current => ({ ...current, sections: current.sections.filter(s => s.clientId !== clientId) }))
  }

  function localGenerate(kind: 'club' | 'theater' | 'festival') {
    const next = emptyLayout()
    if (kind === 'club') {
      next.sections.push(
        { clientId: 'dance', name: 'Дансинг', floorId: 'floor-1', floorName: 'Партер', type: 'Standing', shape: 'Rounded', capacity: 260, priceModifier: 0, colorHex: '#22c55e', x: 190, y: 250, width: 420, height: 260, rotation: 0, seats: [] },
        { clientId: 'vip', name: 'VIP сепарета', floorId: 'floor-1', floorName: 'Партер', type: 'VIP', shape: 'Rounded', capacity: 36, priceModifier: 30, colorHex: '#f59e0b', x: 680, y: 250, width: 300, height: 210, rotation: 0, seats: gridSeats(3, 12, 24, 42) },
      )
    } else if (kind === 'theater') {
      next.sections.push({ clientId: 'main', name: 'Партер', floorId: 'floor-1', floorName: 'Партер', type: 'Seated', shape: 'Rounded', capacity: 120, priceModifier: 0, colorHex: '#2456ff', x: 210, y: 245, width: 720, height: 330, rotation: 0, seats: gridSeats(8, 15, 38, 48) })
    } else {
      next.sections.push({ clientId: 'zone', name: 'Фестивална зона', floorId: 'floor-1', floorName: 'Партер', type: 'Standing', shape: 'Rounded', capacity: 900, priceModifier: 0, colorHex: '#22c55e', x: 120, y: 230, width: 760, height: 360, rotation: 0, seats: [] })
    }
    setLayout(next)
  }

  async function aiGenerate() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setError('')
    try {
      const data = new FormData()
      data.append('description', aiPrompt)
      const res = await api.post('/api/layouts/ai-generate', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.layout) setLayout(res.data.layout)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'AI layout не успя. Използвай локален шаблон.')
    } finally {
      setAiLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, layoutJson: JSON.stringify(layout) }
      if (id) await api.put(`/api/layouts/${id}`, payload)
      else {
        const res = await api.post('/api/layouts', payload)
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

      {error && <div className="auth-zine-validation mb-3"><ul><li>{error}</li></ul></div>}

      <form onSubmit={submit} className="layout-editor-shell">
        <aside className="groove-paper-card">
          <div className="auth-zine-form">
            <div className="auth-zine-field"><label>Зала *</label><input className="form-control" value={form.venueName} onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))} required /></div>
            <div className="auth-zine-field"><label>Име на схема *</label><input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div className="auth-zine-field"><label>Статус</label><select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>Draft</option><option>Active</option><option>Archived</option></select></div>

            <div className="groove-form-actions">
              <button type="button" className="groove-button groove-button-paper" onClick={() => addSection('Seated')}><i className="bi bi-grid-3x3-gap" /> Seats</button>
              <button type="button" className="groove-button groove-button-paper" onClick={() => addSection('Standing')}><i className="bi bi-person-standing" /> Standing</button>
              <button type="button" className="groove-button groove-button-paper" onClick={() => addSection('VIP')}><i className="bi bi-star" /> VIP</button>
            </div>

            <div className="auth-zine-field">
              <label>AI layout</label>
              <textarea className="form-control" rows={3} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Опиши залата, сцената, VIP зоните, капацитета..." />
            </div>
            <div className="groove-form-actions">
              <button type="button" className="groove-button groove-button-dark" onClick={aiGenerate} disabled={aiLoading}><i className="bi bi-stars" /> {aiLoading ? 'Генерирам...' : 'AI generate'}</button>
              <button type="button" className="groove-button groove-button-paper" onClick={() => localGenerate('club')}>Club</button>
              <button type="button" className="groove-button groove-button-paper" onClick={() => localGenerate('theater')}>Theater</button>
              <button type="button" className="groove-button groove-button-paper" onClick={() => localGenerate('festival')}>Festival</button>
            </div>

            <div className="groove-data-list">
              <dt>Секции</dt><dd>{stats.sections}</dd>
              <dt>Места</dt><dd>{stats.seats}</dd>
              <dt>Капацитет</dt><dd>{stats.capacity}</dd>
            </div>

            <button className="auth-zine-button auth-zine-button-red" disabled={saving}><i className="bi bi-check2" /> {saving ? 'Запазване...' : 'Запази'}</button>
          </div>
        </aside>

        <div className="groove-paper-card">
          <div className="evt-layout" style={{ position: 'relative', aspectRatio: '1200 / 820', minHeight: 420 }}>
            {layout.sections.map(section => (
              <div
                key={section.clientId}
                className={`event-seat-section shape-${section.shape.toLowerCase()}`}
                style={{ position: 'absolute', left: `${(section.x / layout.canvasWidth) * 100}%`, top: `${(section.y / layout.canvasHeight) * 100}%`, width: `${(section.width / layout.canvasWidth) * 100}%`, height: `${(section.height / layout.canvasHeight) * 100}%`, ['--seat-zone-color' as any]: section.colorHex }}
              >
                <strong className="event-seat-section__title">{section.name}</strong>
                {section.seats.slice(0, 220).map((seat, index) => (
                  <span key={`${seat.row}-${seat.number}-${index}`} className="layout-pro-seat" style={{ position: 'absolute', left: seat.x, top: seat.y, width: seat.radius * 2, height: seat.radius * 2, ['--layout-seat-color' as any]: section.colorHex }} title={seat.label ?? `${seat.row}${seat.number}`} />
                ))}
              </div>
            ))}
          </div>

          <div className="mt-4">
            {layout.sections.filter(s => s.shape !== 'Stage').map(section => (
              <div key={section.clientId} className="row g-2 align-items-end mb-2">
                <div className="col-md-3"><input className="form-control" value={section.name} onChange={e => updateSection(section.clientId, { name: e.target.value })} /></div>
                <div className="col-md-2"><select className="form-select" value={section.type} onChange={e => updateSection(section.clientId, { type: e.target.value as SectionType })}><option>Seated</option><option>Standing</option><option>VIP</option><option>Table</option></select></div>
                <div className="col-md-2"><input className="form-control" type="number" value={section.capacity} onChange={e => updateSection(section.clientId, { capacity: Number(e.target.value) })} /></div>
                <div className="col-md-2"><input className="form-control" type="color" value={section.colorHex} onChange={e => updateSection(section.clientId, { colorHex: e.target.value })} /></div>
                <div className="col-md-2"><button type="button" className="groove-button groove-button-paper groove-button--sm text-danger" onClick={() => removeSection(section.clientId)}><i className="bi bi-trash" /></button></div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </section>
  )
}

export default function LayoutEditorPage() {
  return <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" /></div>}><LayoutEditorInner /></Suspense>
}
