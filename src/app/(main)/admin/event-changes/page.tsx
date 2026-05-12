'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { mediaUrl } from '@/lib/media'

interface EventChange {
  id: number
  eventId: number
  eventTitle: string
  organizerName: string
  submittedAt: string
  changeJson: string
  currentTitle?: string
  currentCity?: string
  currentAddress?: string
  currentStartTime?: string
  currentEndTime?: string
  currentGenre?: string
  currentImageUrl?: string
  pending?: Partial<PendingEventChange>
}

interface PendingEventChange {
  title: string
  city: string
  address: string
  startTime: string
  endTime: string
  genre: string
  imageUrl?: string
  description?: string
}

function parsePending(row: EventChange): Partial<PendingEventChange> {
  if (row.pending) return row.pending
  try {
    return JSON.parse(row.changeJson) as Partial<PendingEventChange>
  } catch {
    return {}
  }
}

export default function AdminEventChangesPage() {
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')
  const [rows, setRows] = useState<EventChange[]>([])
  const [selected, setSelected] = useState<EventChange | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (selectedId) {
          try {
            const detail = await api.get<EventChange>(`/api/admin/event-changes/${selectedId}`)
            if (active) setSelected(detail.data)
            return
          } catch {}
        }
        const r = await api.get<EventChange[]>('/api/admin/event-changes')
        if (!active) return
        setRows(r.data)
        if (selectedId) {
          setSelected(r.data.find(row => String(row.id) === selectedId || String(row.eventId) === selectedId) ?? null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [selectedId])

  async function act(id: number, action: 'approve' | 'reject') {
    setActionId(id)
    try {
      await api.post(`/api/admin/event-changes/${id}/${action}`)
      setRows(prev => prev.filter(r => r.id !== id))
      if (selected?.id === id) setSelected(null)
    } finally {
      setActionId(null)
    }
  }

  if (selectedId && !loading) {
    const row = selected
    const pending = row ? parsePending(row) : {}

    return (
      <section className="groove-app-page">
        <div className="groove-page-hero">
          <div className="groove-page-hero__copy">
            <span className="groove-stamp groove-stamp-yellow">Админ преглед</span>
            <h1>Промени по събитие.</h1>
            <p>Публикуваната версия остава активна, докато тези промени не бъдат одобрени.</p>
          </div>
          <div className="groove-page-actions">
            <Link href="/admin/events?pending=true" className="groove-button groove-button-paper">
              <i className="bi bi-arrow-left" /> Чакащи
            </Link>
            {row && (
              <button className="groove-button groove-button-dark" type="button" disabled={actionId === row.id} onClick={() => act(row.id, 'approve')}>
                <i className="bi bi-check-circle" /> Одобри промени
              </button>
            )}
          </div>
        </div>

        {!row ? (
          <div className="groove-empty-card">
            <i className="bi bi-search" />
            <h2 className="groove-panel-title">Промяната не е намерена</h2>
            <Link href="/admin/event-changes" className="groove-button groove-button-paper mt-3">Всички промени</Link>
          </div>
        ) : (
          <>
            <div className="groove-split">
              <article className="groove-info-card">
                <span className="groove-kicker">Текуща версия</span>
                {row.currentImageUrl && <img src={mediaUrl(row.currentImageUrl)} className="img-fluid rounded mb-3" alt={row.currentTitle ?? row.eventTitle} style={{ maxHeight: 240, width: '100%', objectFit: 'cover' }} />}
                <h2 className="groove-panel-title">{row.currentTitle ?? row.eventTitle}</h2>
                <dl className="groove-data-list mt-3">
                  <dt>Локация</dt>
                  <dd>{[row.currentAddress, row.currentCity].filter(Boolean).join(', ') || 'Няма данни'}</dd>
                  <dt>Начало</dt>
                  <dd>{row.currentStartTime ? format(new Date(row.currentStartTime), 'dd.MM.yyyy HH:mm') : 'Няма данни'}</dd>
                  <dt>Край</dt>
                  <dd>{row.currentEndTime ? format(new Date(row.currentEndTime), 'dd.MM.yyyy HH:mm') : 'Няма данни'}</dd>
                  <dt>Жанр</dt>
                  <dd>{row.currentGenre ?? 'Няма данни'}</dd>
                </dl>
              </article>

              <article className="groove-info-card">
                <span className="groove-kicker">Нова версия</span>
                {pending.imageUrl && <img src={mediaUrl(pending.imageUrl)} className="img-fluid rounded mb-3" alt={pending.title ?? row.eventTitle} style={{ maxHeight: 240, width: '100%', objectFit: 'cover' }} />}
                <h2 className="groove-panel-title">{pending.title ?? row.eventTitle}</h2>
                <dl className="groove-data-list mt-3">
                  <dt>Локация</dt>
                  <dd>{[pending.address, pending.city].filter(Boolean).join(', ') || 'Няма данни'}</dd>
                  <dt>Начало</dt>
                  <dd>{pending.startTime ? format(new Date(pending.startTime), 'dd.MM.yyyy HH:mm') : 'Няма данни'}</dd>
                  <dt>Край</dt>
                  <dd>{pending.endTime ? format(new Date(pending.endTime), 'dd.MM.yyyy HH:mm') : 'Няма данни'}</dd>
                  <dt>Жанр</dt>
                  <dd>{pending.genre ?? 'Няма данни'}</dd>
                  <dt>Изпратено</dt>
                  <dd>{format(new Date(row.submittedAt), 'dd.MM.yyyy HH:mm')}</dd>
                </dl>
              </article>
            </div>

            <section className="groove-page-section">
              <div className="groove-info-card">
                <span className="groove-kicker">Описание</span>
                <p className="mb-0">{pending.description ?? 'Няма описание в payload-а.'}</p>
              </div>
            </section>
          </>
        )}
      </section>
    )
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Администратор</span>
          <h1 className="groove-panel-title">Промени по събития</h1>
        </div>
        <Link href="/admin/events?pending=true" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Събития</Link>
      </div>
      <div className="groove-paper-card">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : rows.length === 0 ? (
          <div className="groove-empty-card m-0"><i className="bi bi-check2-circle" /><h2 className="groove-panel-title">Няма чакащи промени</h2></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover groove-table">
              <thead><tr><th>Събитие</th><th>Организатор</th><th>Подадено</th><th>Payload</th><th></th></tr></thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td><Link href={`/events/${row.eventId}`}>{row.eventTitle}</Link></td>
                    <td>{row.organizerName}</td>
                    <td>{format(new Date(row.submittedAt), 'dd.MM.yyyy HH:mm')}</td>
                    <td><pre className="small mb-0" style={{ maxWidth: 420, whiteSpace: 'pre-wrap' }}>{row.changeJson}</pre></td>
                    <td className="text-end">
                      <button className="groove-button groove-button-dark groove-button--sm me-2" disabled={actionId === row.id} onClick={() => act(row.id, 'approve')}>Одобри</button>
                      <button className="groove-button groove-button-paper groove-button--sm" disabled={actionId === row.id} onClick={() => act(row.id, 'reject')}>Откажи</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
