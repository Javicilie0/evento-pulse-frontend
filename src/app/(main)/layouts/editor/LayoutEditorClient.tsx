'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

type SectionType = 'Seated' | 'Standing' | 'VIP' | 'Table'
type SeatType = 'Standard' | 'Accessible' | 'VIP' | 'Table'
type SeatStatus = 'Active' | 'Blocked'
type Shape = 'Rectangle' | 'Rounded' | 'Circle' | 'Stage' | 'Label'

type Seat = {
  id?: number
  clientId: string
  row: string
  number: string
  label?: string
  x: number
  y: number
  radius: number
  rotation: number
  capacity: number
  isCapacityUnlimited: boolean
  seatType: SeatType
  status: SeatStatus
}

type LayoutSection = {
  id?: number
  clientId: string
  name: string
  floorId: string
  floorName: string
  type: SectionType
  shape: Shape
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

type Floor = { clientId: string; name: string }
type LayoutJson = { canvasWidth: number; canvasHeight: number; floors: Floor[]; sections: LayoutSection[] }
type Selection = { type: 'section' | 'seat'; sectionId: string; seatId?: string } | null

const colors: Record<SectionType, string> = { Seated: '#2456ff', Standing: '#22c55e', VIP: '#f59e0b', Table: '#0d9488' }

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function defaultLayout(): LayoutJson {
  return {
    canvasWidth: 1200,
    canvasHeight: 820,
    floors: [{ clientId: 'floor-1', name: 'Партер' }],
    sections: [
      sectionPreset('stage-1', 'СЦЕНА', 'floor-1', 'Партер', 'Seated', 'Stage', 330, 54, 520, 118, '#e5e7eb', []),
      sectionPreset('label-entrance', 'Вход', 'floor-1', 'Партер', 'Seated', 'Label', 118, 78, 120, 44, '#111827', []),
      sectionPreset('section-1', 'Основна секция', 'floor-1', 'Партер', 'Seated', 'Rounded', 150, 250, 820, 260, '#df5f83', []),
    ],
  }
}

function sectionPreset(clientId: string, name: string, floorId: string, floorName: string, type: SectionType, shape: Shape, x: number, y: number, width: number, height: number, colorHex = colors[type], seats: Seat[] = []): LayoutSection {
  return { clientId, name, floorId, floorName, type, shape, capacity: seats.length, priceModifier: 0, colorHex, x, y, width, height, rotation: 0, seats }
}

function makeSeat(row: string, number: number, x: number, y: number, radius = 15, seatType: SeatType = 'Standard'): Seat {
  return {
    clientId: uid('seat'),
    row,
    number: String(number),
    label: `${row}${number}`,
    x,
    y,
    radius,
    rotation: 0,
    capacity: seatType === 'Table' ? 4 : 1,
    isCapacityUnlimited: false,
    seatType,
    status: 'Active',
  }
}

function rows(rowsCount: number, seatsPerRow: number, startX = 34, startY = 42) {
  const result: Seat[] = []
  for (let r = 0; r < rowsCount; r++) {
    const row = String.fromCharCode(65 + r)
    for (let c = 1; c <= seatsPerRow; c++) result.push(makeSeat(row, c, startX + (c - 1) * 34, startY + r * 34))
  }
  return result
}

function tableSeats(size: number, capacity: number) {
  const cx = 92
  const cy = 92
  const radius = 66
  return Array.from({ length: size }, (_, index) => {
    const angle = (Math.PI * 2 * index) / size - Math.PI / 2
    const seat = makeSeat('T', index + 1, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 18, 'Table')
    seat.capacity = capacity
    seat.label = `Маса ${index + 1}`
    return seat
  })
}

function normalize(raw: any): LayoutJson {
  const layout = raw && typeof raw === 'object' ? raw : defaultLayout()
  const floors = Array.isArray(layout.floors) && layout.floors.length ? layout.floors : [{ clientId: 'floor-1', name: 'Партер' }]
  const sections = Array.isArray(layout.sections) ? layout.sections : []
  return {
    canvasWidth: Number(layout.canvasWidth) || 1200,
    canvasHeight: Number(layout.canvasHeight) || 820,
    floors: floors.map((f: any, i: number) => ({ clientId: f.clientId || `floor-${i + 1}`, name: f.name || `Етаж ${i + 1}` })),
    sections: sections.map((s: any, i: number) => ({
      clientId: s.clientId || `section-${i + 1}`,
      id: s.id,
      name: s.name || 'Секция',
      floorId: s.floorId || floors[0].clientId,
      floorName: s.floorName || floors[0].name,
      type: s.type || 'Seated',
      shape: s.shape || 'Rounded',
      capacity: Number(s.capacity) || 0,
      priceModifier: Number(s.priceModifier) || 0,
      colorHex: s.colorHex || colors[s.type as SectionType] || '#2456ff',
      x: Number(s.x) || 80,
      y: Number(s.y) || 120,
      width: Number(s.width) || 280,
      height: Number(s.height) || 180,
      rotation: Number(s.rotation) || 0,
      seats: Array.isArray(s.seats) ? s.seats.map((seat: any, index: number) => ({
        clientId: seat.clientId || `seat-${i}-${index}`,
        id: seat.id,
        row: seat.row || 'A',
        number: String(seat.number || index + 1),
        label: seat.label,
        x: Number(seat.x) || 24,
        y: Number(seat.y) || 24,
        radius: Number(seat.radius) || 15,
        rotation: Number(seat.rotation) || 0,
        capacity: Number(seat.capacity) || 1,
        isCapacityUnlimited: Boolean(seat.isCapacityUnlimited),
        seatType: seat.seatType || 'Standard',
        status: seat.status || 'Active',
      })) : [],
    })),
  }
}

function LayoutEditorInner() {
  const id = useSearchParams().get('id')
  const router = useRouter()
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [form, setForm] = useState({ venueName: 'Основна зала', name: 'Стандартна схема', status: 'Active' })
  const [layout, setLayout] = useState<LayoutJson>(defaultLayout())
  const [activeFloorId, setActiveFloorId] = useState('floor-1')
  const [selected, setSelected] = useState<Selection>({ type: 'section', sectionId: 'section-1' })
  const [history, setHistory] = useState<LayoutJson[]>([])
  const [future, setFuture] = useState<LayoutJson[]>([])
  const [rowsCount, setRowsCount] = useState(5)
  const [rowsSize, setRowsSize] = useState(10)
  const [tableSize, setTableSize] = useState(6)
  const [tableCapacity, setTableCapacity] = useState(4)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiImage, setAiImage] = useState<File | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.get(`/api/layouts/${id}`).then(r => {
      setForm({ venueName: r.data.venueName, name: r.data.name, status: r.data.status })
      const parsed = normalize(r.data.layoutJson ? JSON.parse(r.data.layoutJson) : null)
      setLayout(parsed)
      setActiveFloorId(parsed.floors[0]?.clientId || 'floor-1')
      setSelected(parsed.sections[0] ? { type: 'section', sectionId: parsed.sections[0].clientId } : null)
    }).catch(() => setError('Схемата не може да бъде заредена.'))
  }, [id])

  const visibleSections = layout.sections.filter(s => s.floorId === activeFloorId)
  const selectedSection = selected ? layout.sections.find(s => s.clientId === selected.sectionId) : undefined
  const selectedSeat = selected?.type === 'seat' ? selectedSection?.seats.find(s => s.clientId === selected.seatId) : undefined
  const selectedTitle = selectedSeat?.label || selectedSection?.name || 'Нищо не е избрано'
  const stats = useMemo(() => ({
    sections: layout.sections.filter(s => s.shape !== 'Stage' && s.shape !== 'Label').length,
    seats: layout.sections.reduce((sum, s) => sum + s.seats.length, 0),
    capacity: layout.sections.reduce((sum, s) => sum + (s.seats.length ? s.seats.reduce((a, seat) => a + (seat.isCapacityUnlimited ? 0 : seat.capacity), 0) : s.capacity), 0),
  }), [layout])

  function commit(next: LayoutJson) {
    setHistory(prev => [...prev.slice(-24), layout])
    setFuture([])
    setLayout(next)
  }

  function patchSection(sectionId: string, patch: Partial<LayoutSection>) {
    commit({ ...layout, sections: layout.sections.map(s => s.clientId === sectionId ? { ...s, ...patch } : s) })
  }

  function patchSeat(sectionId: string, seatId: string, patch: Partial<Seat>) {
    commit({ ...layout, sections: layout.sections.map(s => s.clientId === sectionId ? { ...s, seats: s.seats.map(seat => seat.clientId === seatId ? { ...seat, ...patch } : seat) } : s) })
  }

  function addFloor() {
    const index = layout.floors.length + 1
    const floor = { clientId: uid('floor'), name: `Етаж ${index}` }
    commit({ ...layout, floors: [...layout.floors, floor] })
    setActiveFloorId(floor.clientId)
  }

  function renameFloor(name: string) {
    const floorName = name || 'Етаж'
    commit({
      ...layout,
      floors: layout.floors.map(f => f.clientId === activeFloorId ? { ...f, name: floorName } : f),
      sections: layout.sections.map(s => s.floorId === activeFloorId ? { ...s, floorName } : s),
    })
  }

  function addSection(type: SectionType, shape: Shape = type === 'Table' ? 'Circle' : 'Rounded') {
    const floor = layout.floors.find(f => f.clientId === activeFloorId) || layout.floors[0]
    const index = layout.sections.length + 1
    const seats = type === 'Seated' || type === 'VIP' ? rows(4, 10) : type === 'Table' ? tableSeats(6, 4) : []
    const next = sectionPreset(uid('section'), type === 'Standing' ? 'Правостоящи' : type === 'VIP' ? 'VIP зона' : type === 'Table' ? 'Маси' : `Секция ${index}`, floor.clientId, floor.name, type, shape, 130 + (index % 3) * 90, 190 + (index % 4) * 42, type === 'Table' ? 220 : 340, type === 'Table' ? 220 : 210, colors[type], seats)
    next.capacity = type === 'Standing' ? 160 : seats.length
    commit({ ...layout, sections: [...layout.sections, next] })
    setSelected({ type: 'section', sectionId: next.clientId })
  }

  function addStage() {
    const floor = layout.floors.find(f => f.clientId === activeFloorId) || layout.floors[0]
    const next = sectionPreset(uid('stage'), 'СЦЕНА', floor.clientId, floor.name, 'Seated', 'Stage', 330, 54, 520, 118, '#e5e7eb', [])
    commit({ ...layout, sections: [...layout.sections, next] })
    setSelected({ type: 'section', sectionId: next.clientId })
  }

  function addLabel() {
    const floor = layout.floors.find(f => f.clientId === activeFloorId) || layout.floors[0]
    const next = sectionPreset(uid('label'), 'Надпис', floor.clientId, floor.name, 'Seated', 'Label', 120, 90, 150, 50, '#111827', [])
    commit({ ...layout, sections: [...layout.sections, next] })
    setSelected({ type: 'section', sectionId: next.clientId })
  }

  function addSeat() {
    if (!selectedSection) return
    const seat = makeSeat('A', selectedSection.seats.length + 1, 40 + selectedSection.seats.length * 8, 48 + selectedSection.seats.length * 8)
    commit({ ...layout, sections: layout.sections.map(s => s.clientId === selectedSection.clientId ? { ...s, seats: [...s.seats, seat] } : s) })
    setSelected({ type: 'seat', sectionId: selectedSection.clientId, seatId: seat.clientId })
  }

  function generateRows() {
    if (!selectedSection) return
    const nextSeats = rows(rowsCount, rowsSize)
    patchSection(selectedSection.clientId, { type: 'Seated', shape: selectedSection.shape === 'Label' || selectedSection.shape === 'Stage' ? 'Rounded' : selectedSection.shape, seats: nextSeats, capacity: nextSeats.length })
  }

  function generateTable() {
    if (!selectedSection) return
    const nextSeats = tableSeats(tableSize, tableCapacity)
    patchSection(selectedSection.clientId, { type: 'Table', shape: 'Circle', seats: nextSeats, capacity: nextSeats.reduce((sum, seat) => sum + seat.capacity, 0), colorHex: colors.Table })
  }

  function duplicateSelected() {
    if (!selectedSection) return
    if (selected?.type === 'seat' && selectedSeat) {
      const copy = { ...selectedSeat, clientId: uid('seat'), x: selectedSeat.x + 24, y: selectedSeat.y + 24, label: `${selectedSeat.label || selectedSeat.row + selectedSeat.number} copy` }
      commit({ ...layout, sections: layout.sections.map(s => s.clientId === selectedSection.clientId ? { ...s, seats: [...s.seats, copy] } : s) })
      setSelected({ type: 'seat', sectionId: selectedSection.clientId, seatId: copy.clientId })
      return
    }
    const copy = { ...selectedSection, clientId: uid('section'), name: `${selectedSection.name} copy`, x: selectedSection.x + 36, y: selectedSection.y + 36, seats: selectedSection.seats.map(seat => ({ ...seat, clientId: uid('seat') })) }
    commit({ ...layout, sections: [...layout.sections, copy] })
    setSelected({ type: 'section', sectionId: copy.clientId })
  }

  function deleteSelected() {
    if (!selected) return
    if (selected.type === 'seat') {
      commit({ ...layout, sections: layout.sections.map(s => s.clientId === selected.sectionId ? { ...s, seats: s.seats.filter(seat => seat.clientId !== selected.seatId) } : s) })
      setSelected({ type: 'section', sectionId: selected.sectionId })
      return
    }
    commit({ ...layout, sections: layout.sections.filter(s => s.clientId !== selected.sectionId) })
    setSelected(null)
  }

  function undo() {
    const previous = history.at(-1)
    if (!previous) return
    setFuture(prev => [layout, ...prev])
    setHistory(prev => prev.slice(0, -1))
    setLayout(previous)
  }

  function redo() {
    const next = future[0]
    if (!next) return
    setHistory(prev => [...prev, layout])
    setFuture(prev => prev.slice(1))
    setLayout(next)
  }

  async function aiGenerate() {
    if (!aiPrompt.trim() && !aiImage) return
    setAiLoading(true)
    setError('')
    try {
      const data = new FormData()
      data.append('description', aiPrompt)
      if (aiImage) data.append('image', aiImage)
      const res = await api.post('/api/layouts/ai-generate', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.layout) {
        const generated = normalize(res.data.layout)
        commit(generated)
        setActiveFloorId(generated.floors[0]?.clientId || 'floor-1')
        setSelected(generated.sections[0] ? { type: 'section', sectionId: generated.sections[0].clientId } : null)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'AI не успя да върне валиден layout. Използвай ръчните инструменти.')
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

  function stagePoint(e: React.PointerEvent) {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: ((e.clientX - rect.left) / rect.width) * layout.canvasWidth, y: ((e.clientY - rect.top) / rect.height) * layout.canvasHeight }
  }

  function moveSection(section: LayoutSection, e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('.layout-pro-seat')) return
    const start = stagePoint(e)
    const original = { x: section.x, y: section.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const onMove = (moveEvent: PointerEvent) => {
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = ((moveEvent.clientX - rect.left) / rect.width) * layout.canvasWidth
      const y = ((moveEvent.clientY - rect.top) / rect.height) * layout.canvasHeight
      setLayout(current => ({ ...current, sections: current.sections.map(s => s.clientId === section.clientId ? { ...s, x: Math.round(original.x + x - start.x), y: Math.round(original.y + y - start.y) } : s) }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <section className="groove-app-page layout-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Редактор на зала</span>
          <h1>{id ? 'Редакция' : 'Нов'} <span>seat map</span>.</h1>
          <p>Създай преизползваема карта с етажи, секции, редове, правостоящи зони, VIP места и маси.</p>
        </div>
        <div className="groove-page-actions">
          <Link href="/layouts" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> My layouts</Link>
        </div>
      </div>

      {error && <div className="auth-zine-validation mb-3"><ul><li>{error}</li></ul></div>}

      <form onSubmit={submit} className="layout-editor-form">
        <div className="layout-pro-meta">
          <label><span>Venue</span><input className="form-control" value={form.venueName} onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))} required /></label>
          <label><span>Layout name</span><input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></label>
          <label><span>Статус</span><select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>Draft</option><option>Active</option><option>Archived</option></select></label>
        </div>

        <section className="layout-ai-card">
          <div className="layout-ai-card__copy">
            <span className="groove-kicker">AI старт</span>
            <h2>Генерирай първа схема с AI от описание или снимка.</h2>
            <p>Опиши залата с нормални думи или качи снимка. След това донагласяш всичко с инструментите отдолу.</p>
          </div>
          <div className="layout-ai-card__controls">
            <textarea rows={3} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Пример: театър с 2 етажа, партер 10 реда по 12 места, балкон 6 реда по 10 места, 8 VIP маси..." />
            <div className="layout-ai-card__actions">
              <label className="layout-ai-upload"><i className="bi bi-image" /><span>{aiImage ? aiImage.name : 'Качи снимка'}</span><input type="file" accept="image/*" onChange={e => setAiImage(e.target.files?.[0] || null)} /></label>
              <button type="button" className="groove-button groove-button-dark" onClick={aiGenerate} disabled={aiLoading}><i className="bi bi-magic" /> {aiLoading ? 'Генерирам...' : 'Генерирай'}</button>
              <button type="button" className="groove-button groove-button-paper" onClick={() => setAiImage(null)}><i className="bi bi-x-lg" /> Махни снимката</button>
              <button type="button" className="groove-button groove-button-paper" onClick={() => setShowTutorial(true)}><i className="bi bi-play-circle" /> Туториал</button>
            </div>
          </div>
        </section>

        <div className="layout-pro-shell" data-layout-editor>
          <aside className="layout-pro-toolbar">
            <button type="button" onClick={addFloor}><i className="bi bi-layers" /><span>Етаж</span></button>
            <button type="button" onClick={() => addSection('Seated')}><i className="bi bi-bounding-box" /><span>Секция</span></button>
            <button type="button" onClick={addStage}><i className="bi bi-easel2" /><span>Сцена</span></button>
            <button type="button" onClick={addLabel}><i className="bi bi-type" /><span>Надпис</span></button>
            <button type="button" onClick={addSeat} disabled={!selectedSection}><i className="bi bi-record-circle" /><span>Едно място</span></button>
            <button type="button" onClick={() => addSection('Standing')}><i className="bi bi-people" /><span>Правостоящи</span></button>
            <button type="button" onClick={() => addSection('Table')}><i className="bi bi-record-circle" /><span>Маса</span></button>
            <button type="button" onClick={generateRows} disabled={!selectedSection}><i className="bi bi-grid-3x3" /><span>Редове</span></button>
            <button type="button" onClick={generateTable} disabled={!selectedSection}><i className="bi bi-circle" /><span>Места около маса</span></button>
            <button type="button" onClick={undo} disabled={!history.length}><i className="bi bi-arrow-counterclockwise" /><span>Назад</span></button>
            <button type="button" onClick={redo} disabled={!future.length}><i className="bi bi-arrow-clockwise" /><span>Напред</span></button>
            <button type="button" onClick={duplicateSelected} disabled={!selected}><i className="bi bi-copy" /><span>Дублирай</span></button>
            <button type="button" className="is-danger" onClick={deleteSelected} disabled={!selected}><i className="bi bi-trash" /><span>Изтрий</span></button>
          </aside>

          <main className="layout-pro-workspace">
            <div className="layout-pro-floorbar">
              <div className="layout-pro-floor-tabs">{layout.floors.map(f => <button type="button" key={f.clientId} className={f.clientId === activeFloorId ? 'is-active' : ''} onClick={() => setActiveFloorId(f.clientId)}>{f.name}</button>)}</div>
              <label className="layout-pro-floor-name"><span>Име на етаж</span><input value={layout.floors.find(f => f.clientId === activeFloorId)?.name || ''} onChange={e => renameFloor(e.target.value)} /></label>
            </div>
            <div className="layout-pro-stage-scroll">
              <div className="layout-pro-stage" ref={stageRef}>
                {visibleSections.map(section => (
                  <div
                    key={section.clientId}
                    className={`layout-pro-section shape-${section.shape.toLowerCase()} ${selected?.type === 'section' && selected.sectionId === section.clientId ? 'is-selected' : ''}`}
                    data-section-type={section.type}
                    onClick={() => setSelected({ type: 'section', sectionId: section.clientId })}
                    onPointerDown={e => moveSection(section, e)}
                    style={{ left: section.x, top: section.y, width: section.width, height: section.height, transform: `rotate(${section.rotation}deg)`, ['--seat-zone-color' as any]: section.colorHex }}
                  >
                    <div className="layout-pro-section__head"><strong>{section.name}</strong><small>{section.type} · {section.seats.length || section.capacity}</small></div>
                    {section.seats.map(seat => (
                      <button
                        type="button"
                        key={seat.clientId}
                        className={`layout-pro-seat ${seat.seatType === 'Table' ? 'is-table' : ''} ${seat.status === 'Blocked' ? 'is-blocked' : ''} ${selected?.type === 'seat' && selected.seatId === seat.clientId ? 'is-selected' : ''}`}
                        onClick={e => { e.stopPropagation(); setSelected({ type: 'seat', sectionId: section.clientId, seatId: seat.clientId }) }}
                        style={{ left: seat.x, top: seat.y, width: seat.radius * 2, height: seat.radius * 2 }}
                      ><small>{seat.label || seat.number}</small></button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </main>

          <aside className="layout-pro-panel">
            <div><span className="groove-kicker">Избрано</span><h2>{selectedTitle}</h2></div>
            <div className="layout-pro-panel__group">
              <label><span>Име на секция</span><input value={selectedSection?.name || ''} onChange={e => selectedSection && patchSection(selectedSection.clientId, { name: e.target.value })} disabled={!selectedSection} /></label>
              <label><span>Тип</span><select value={selectedSection?.type || 'Seated'} onChange={e => selectedSection && patchSection(selectedSection.clientId, { type: e.target.value as SectionType, colorHex: colors[e.target.value as SectionType] })} disabled={!selectedSection}><option value="Seated">Седящи места</option><option value="Standing">Правостоящи</option><option value="VIP">VIP</option><option value="Table">Маси</option></select></label>
              <label><span>Форма</span><select value={selectedSection?.shape || 'Rounded'} onChange={e => selectedSection && patchSection(selectedSection.clientId, { shape: e.target.value as Shape })} disabled={!selectedSection}><option value="Rectangle">Правоъгълник</option><option value="Rounded">Заоблена</option><option value="Circle">Кръг</option><option value="Stage">Сцена</option><option value="Label">Надпис</option></select></label>
              <label><span>Добавка към цена</span><input type="number" step="0.01" value={selectedSection?.priceModifier || 0} onChange={e => selectedSection && patchSection(selectedSection.clientId, { priceModifier: Number(e.target.value) })} disabled={!selectedSection} /></label>
              <label><span>Цвят на сектор</span><input type="color" value={selectedSection?.colorHex || '#2456ff'} onChange={e => selectedSection && patchSection(selectedSection.clientId, { colorHex: e.target.value })} disabled={!selectedSection} /></label>
              <div className="layout-pro-grid-2">
                <label><span>X</span><input type="number" value={selectedSection?.x || 0} onChange={e => selectedSection && patchSection(selectedSection.clientId, { x: Number(e.target.value) })} disabled={!selectedSection} /></label>
                <label><span>Y</span><input type="number" value={selectedSection?.y || 0} onChange={e => selectedSection && patchSection(selectedSection.clientId, { y: Number(e.target.value) })} disabled={!selectedSection} /></label>
                <label><span>W</span><input type="number" value={selectedSection?.width || 0} onChange={e => selectedSection && patchSection(selectedSection.clientId, { width: Number(e.target.value) })} disabled={!selectedSection} /></label>
                <label><span>H</span><input type="number" value={selectedSection?.height || 0} onChange={e => selectedSection && patchSection(selectedSection.clientId, { height: Number(e.target.value) })} disabled={!selectedSection} /></label>
              </div>
              <label><span>Завъртане</span><input type="range" min="-45" max="45" value={selectedSection?.rotation || 0} onChange={e => selectedSection && patchSection(selectedSection.clientId, { rotation: Number(e.target.value) })} disabled={!selectedSection} /></label>
            </div>

            <div className="layout-pro-panel__group">
              <label><span>Име на място / маса</span><input value={selectedSeat?.label || ''} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { label: e.target.value })} disabled={!selectedSeat} /></label>
              <div className="layout-pro-grid-2">
                <label><span>Ред</span><input value={selectedSeat?.row || ''} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { row: e.target.value })} disabled={!selectedSeat} /></label>
                <label><span>Номер</span><input value={selectedSeat?.number || ''} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { number: e.target.value })} disabled={!selectedSeat} /></label>
              </div>
              <label><span>Тип място</span><select value={selectedSeat?.seatType || 'Standard'} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { seatType: e.target.value as SeatType })} disabled={!selectedSeat}><option value="Standard">Стандартно</option><option value="Accessible">Достъпно</option><option value="VIP">VIP</option><option value="Table">Маса</option></select></label>
              <label><span>Статус</span><select value={selectedSeat?.status || 'Active'} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { status: e.target.value as SeatStatus })} disabled={!selectedSeat}><option value="Active">Активно</option><option value="Blocked">Блокирано</option></select></label>
              <div className="layout-pro-grid-2">
                <label><span>X</span><input type="number" value={selectedSeat?.x || 0} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { x: Number(e.target.value) })} disabled={!selectedSeat} /></label>
                <label><span>Y</span><input type="number" value={selectedSeat?.y || 0} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { y: Number(e.target.value) })} disabled={!selectedSeat} /></label>
                <label><span>Размер</span><input type="number" value={selectedSeat?.radius || 15} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { radius: Number(e.target.value) })} disabled={!selectedSeat} /></label>
                <label><span>Хора</span><input type="number" min="1" max="100" value={selectedSeat?.capacity || 1} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { capacity: Number(e.target.value) })} disabled={!selectedSeat} /></label>
              </div>
              <label className="layout-pro-check"><input type="checkbox" checked={selectedSeat?.isCapacityUnlimited || false} onChange={e => selectedSeat && selectedSection && patchSeat(selectedSection.clientId, selectedSeat.clientId, { isCapacityUnlimited: e.target.checked })} disabled={!selectedSeat} /><span>Без лимит за група</span></label>
            </div>

            <div className="layout-pro-panel__group">
              <span className="groove-kicker">Бързо генериране</span>
              <div className="layout-pro-grid-2">
                <label><span>Редове</span><input type="number" min="1" value={rowsCount} onChange={e => setRowsCount(Number(e.target.value))} /></label>
                <label><span>В ред</span><input type="number" min="1" value={rowsSize} onChange={e => setRowsSize(Number(e.target.value))} /></label>
                <label><span>Около маса</span><input type="number" min="2" value={tableSize} onChange={e => setTableSize(Number(e.target.value))} /></label>
                <label><span>Кап. маса</span><input type="number" min="1" value={tableCapacity} onChange={e => setTableCapacity(Number(e.target.value))} /></label>
              </div>
            </div>

            <dl className="groove-data-list"><dt>Секции</dt><dd>{stats.sections}</dd><dt>Места</dt><dd>{stats.seats}</dd><dt>Капацитет</dt><dd>{stats.capacity}</dd></dl>
          </aside>
        </div>

        {showTutorial && (
          <div className="layout-tutorial">
            <div className="layout-tutorial__dialog">
              <button type="button" className="layout-tutorial__close" onClick={() => setShowTutorial(false)} aria-label="Затвори"><i className="bi bi-x-lg" /></button>
              <span className="groove-kicker">Туториал</span>
              <h2>Как да направиш схема за 2 минути</h2>
              <ol>
                <li><strong>AI старт:</strong> опиши залата или качи снимка като фон.</li>
                <li><strong>Етажи:</strong> добави партер, балкон или VIP ниво.</li>
                <li><strong>Секции:</strong> създай редове, правостоящи зони или маси.</li>
                <li><strong>Drag & drop:</strong> мести секции директно върху сцената.</li>
                <li><strong>Маси:</strong> капацитетът е за една група, но масата се продава като един bookable обект.</li>
                <li><strong>Undo:</strong> бутонът “Назад” връща последната структурна промяна.</li>
              </ol>
            </div>
          </div>
        )}

        <div className="groove-form-actions mt-3">
          <button type="submit" className="groove-button groove-button-dark" disabled={saving}><i className="bi bi-check-lg" /> {saving ? 'Запазване...' : 'Запази layout'}</button>
          <Link href="/layouts" className="groove-button groove-button-paper">Отказ</Link>
        </div>
      </form>
    </section>
  )
}

export default function LayoutEditorPage() {
  return <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" /></div>}><LayoutEditorInner /></Suspense>
}
