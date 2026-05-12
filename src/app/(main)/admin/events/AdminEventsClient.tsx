'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'

export interface AdminEvent {
  id: number
  title: string
  address?: string
  city: string
  startTime: string
  isApproved: boolean
  hasPendingChanges: boolean
  organizerName: string
  genre: string
  likesCount: number
  createdAt: string
}

export function AdminEventsClient({ initialEvents, pendingOnly }: { initialEvents: AdminEvent[]; pendingOnly: boolean }) {
  const [events, setEvents] = useState(initialEvents)
  const [actionId, setActionId] = useState<number | null>(null)

  async function toggleApprove(id: number) {
    setActionId(id)
    try {
      const res = await api.post<{ isApproved: boolean }>(`/api/admin/events/${id}/approve`)
      setEvents(prev => prev.map(e => e.id === id ? { ...e, isApproved: res.data.isApproved } : e))
    } finally { setActionId(null) }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Каталог</span>
          <h1>Админ преглед на <span>събития</span>.</h1>
          <p>Одобрявай, редактирай и управлявай публикуваните събития и билетите към тях.</p>
        </div>
        <div className="groove-page-actions">
          <Link href={pendingOnly ? '/admin/events' : '/admin/events?pending=true'} className="groove-button groove-button-paper">
            {pendingOnly ? <><i className="bi bi-list" /> Покажи всички</> : <><i className="bi bi-hourglass-split" /> Само чакащи</>}
          </Link>
          <Link href="/admin" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Към админ</Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="groove-empty-card">
          <i className="bi bi-calendar2-event" />
          <h2 className="groove-panel-title">Няма <span>събития</span>.</h2>
        </div>
      ) : (
      <div className="groove-table-card">
        <div className="table-responsive">
          <table className="table table-hover groove-table">
            <thead>
              <tr>
                <th>Заглавие</th>
                <th>Организатор</th>
                <th>Локация</th>
                <th>Начало</th>
                <th>Жанр</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td><strong>{ev.title}</strong></td>
                  <td>{ev.organizerName}</td>
                  <td>{[ev.address, ev.city].filter(Boolean).join(', ')}</td>
                  <td>{format(new Date(ev.startTime), 'dd.MM.yyyy HH:mm')}</td>
                  <td><span className="groove-badge">{ev.genre}</span></td>
                  <td>
                    {ev.hasPendingChanges
                      ? <span className="groove-status-badge groove-status-badge-warning">Чака промени</span>
                      : ev.isApproved
                        ? <span className="groove-status-badge groove-status-badge-success">Одобрено</span>
                        : <span className="groove-status-badge groove-status-badge-warning">Чака</span>}
                  </td>
                  <td>
                    <div className="groove-list-actions">
                    <Link href={`/events/${ev.id}`} className="groove-button groove-button-paper"><i className="bi bi-eye" /> Преглед</Link>
                    <Link href={`/events/${ev.id}/edit`} className="groove-button groove-button-paper"><i className="bi bi-pencil" /> Редакция</Link>
                    <Link href={`/tickets/manage/${ev.id}`} className="groove-button groove-button-paper"><i className="bi bi-ticket-perforated" /> Билети</Link>
                    <Link href={`/events/${ev.id}/delete`} className="groove-button groove-button-paper"><i className="bi bi-trash" /> Изтрий</Link>
                    {ev.hasPendingChanges && (
                      <Link href={`/admin/event-changes?id=${ev.id}`} className="groove-button groove-button-paper">
                        <i className="bi bi-file-earmark-diff" /> Промени
                      </Link>
                    )}
                    <button
                      className={`groove-button ${ev.isApproved && !ev.hasPendingChanges ? 'groove-button-paper' : 'groove-button-dark'}`}
                      onClick={() => toggleApprove(ev.id)}
                      disabled={actionId === ev.id}
                    >
                      {actionId === ev.id
                        ? <span className="spinner-border spinner-border-sm" />
                        : ev.hasPendingChanges ? <><i className="bi bi-check-circle" /> Одобри промени</>
                          : ev.isApproved ? <><i className="bi bi-pause-circle" /> Свали одобрение</>
                            : <><i className="bi bi-check-circle" /> Одобри</>}
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </section>
  )
}
