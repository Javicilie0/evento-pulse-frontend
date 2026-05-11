'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { format } from 'date-fns'
import type { EventCard as EventCardType } from '@/types/api'
import { api } from '@/lib/api'

interface Props {
  event: EventCardType
  canManage?: boolean
}

export function EventCard({ event, canManage }: Props) {
  const { data: session } = useSession()
  const isAuthed = !!session

  const [likes, setLikes] = useState(event.likesCount)
  const [isLiked, setIsLiked] = useState(event.isLiked)
  const [isSaved, setIsSaved] = useState(event.isSaved)
  const [goingCount, setGoingCount] = useState(event.goingCount)
  const [interestedCount, setInterestedCount] = useState(event.interestedCount)
  const [attendance, setAttendance] = useState(event.userAttendanceStatus)

  const isToday = new Date(event.startTime).toDateString() === new Date().toDateString()
  const organizerInitial = event.organizerName?.trim()?.[0]?.toUpperCase() ?? '?'

  async function handleLike() {
    if (!isAuthed) return (window.location.href = '/login')
    try {
      if (isLiked) {
        const r = await api.post(`/api/events/${event.id}/unlike`)
        setLikes(r.data.likesCount); setIsLiked(false)
      } else {
        const r = await api.post(`/api/events/${event.id}/like`)
        setLikes(r.data.likesCount); setIsLiked(true)
      }
    } catch {}
  }

  async function handleSave() {
    if (!isAuthed) return (window.location.href = '/login')
    try {
      if (isSaved) {
        await api.post(`/api/events/${event.id}/unsave`); setIsSaved(false)
      } else {
        await api.post(`/api/events/${event.id}/save`); setIsSaved(true)
      }
    } catch {}
  }

  async function handleAttend(status: 'Going' | 'Interested') {
    if (!isAuthed) return (window.location.href = '/login')
    try {
      if (attendance === status) {
        const r = await api.delete(`/api/events/${event.id}/attend`)
        setAttendance(null)
        setGoingCount(r.data.goingCount)
        setInterestedCount(r.data.interestedCount)
      } else {
        const r = await api.post(`/api/events/${event.id}/attend`, { status })
        setAttendance(status)
        setGoingCount(r.data.goingCount)
        setInterestedCount(r.data.interestedCount)
      }
    } catch {}
  }

  return (
    <div className="card event-card evt-card" data-event-id={event.id} aria-label={event.title}>
      {/* Media */}
      <div className="evt-card__media">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} />
        ) : (
          <div className="evt-card__media-fallback">
            <i className="bi bi-calendar-event" />
          </div>
        )}

        <span className="evt-card__chip">{event.genre}</span>

        {isToday && (
          <span className="evt-card__chip evt-card__chip--today" data-i18n="event.tag.today">Днес</span>
        )}

        {isAuthed && (
          <button
            className={`evt-card__save ${isSaved ? 'is-saved' : ''}`}
            type="button"
            title="Save"
            onClick={handleSave}
          >
            <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="evt-card__body">
        <div className="evt-card__heading">
          <h3 className="evt-card__title">
            <Link href={`/events/${event.id}`} data-translate-text="event-title">
              {event.title}
            </Link>
          </h3>
        </div>

        <div className="evt-card__meta">
          <span><i className="bi bi-geo-alt" /> {event.city}</span>
          <span><i className="bi bi-clock" /> {format(new Date(event.startTime), 'dd.MM HH:mm')}</span>
        </div>

        <span className="evt-card__organizer">
          <span className="evt-card__organizer-avatar">{organizerInitial}</span>
          <span>{event.organizerName}</span>
        </span>

        {/* Actions */}
        <div className="evt-card__actions">
          {isAuthed ? (
            <>
              <button
                className={`evt-card__action ${isLiked ? 'is-on-liked' : ''}`}
                type="button"
                title="Like"
                onClick={handleLike}
              >
                <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`} /> {likes}
              </button>

              <button
                className={`evt-card__action ${attendance === 'Going' ? 'is-on-going' : ''}`}
                type="button"
                title="Going"
                onClick={() => handleAttend('Going')}
              >
                <i className="bi bi-check2-circle" /> {goingCount}
              </button>

              <button
                className={`evt-card__action ${attendance === 'Interested' ? 'is-on-interested' : ''}`}
                type="button"
                title="Interested"
                onClick={() => handleAttend('Interested')}
              >
                <i className="bi bi-star" /> {interestedCount}
              </button>
            </>
          ) : (
            <>
              <span className="evt-card__action"><i className="bi bi-heart" /> {likes}</span>
              <span className="evt-card__action"><i className="bi bi-check2-circle" /> {goingCount}</span>
            </>
          )}

          <Link href={`/events/${event.id}`} className="evt-card__cta">
            <span data-i18n="event.action.details">Виж</span>
            <i className="bi bi-arrow-right" />
          </Link>
        </div>

        {/* Manage actions */}
        {canManage && (
          <div className="evt-card__actions" style={{ borderTop: 'none', paddingTop: 0, marginTop: -2 }}>
            <span className="text-muted small" style={{ marginRight: 'auto' }}>
              <i className="bi bi-shield-check" /> Управление
            </span>
            <div className="evt-card__manage">
              <Link href={`/events/${event.id}/edit`} title="Edit"><i className="bi bi-pencil" /></Link>
              <Link href={`/tickets/manage/${event.id}`} title="Tickets"><i className="bi bi-ticket-perforated" /></Link>
              <Link href={`/events/${event.id}/delete`} className="is-danger" title="Delete"><i className="bi bi-trash" /></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
