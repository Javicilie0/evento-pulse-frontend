'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { mediaUrl } from '@/lib/media'
import type { EventDetails, EventComment, AttendanceStatus } from '@/types/api'

interface Props {
  event: EventDetails
}

export function EventDetailsClient({ event: initial }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const isAuthed = !!session

  const [likes, setLikes] = useState(initial.likesCount)
  const [isLiked, setIsLiked] = useState(initial.isLiked)
  const [isSaved, setIsSaved] = useState(initial.isSaved)
  const [going, setGoing] = useState(initial.goingCount)
  const [interested, setInterested] = useState(initial.interestedCount)
  const [attendance, setAttendance] = useState(initial.userAttendanceStatus)
  const [comments, setComments] = useState<EventComment[]>(initial.comments)
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  async function handleLike() {
    if (!isAuthed) return router.push('/login')
    try {
      if (isLiked) {
        const r = await api.post(`/api/events/${initial.id}/unlike`)
        setLikes(r.data.likesCount); setIsLiked(false)
      } else {
        const r = await api.post(`/api/events/${initial.id}/like`)
        setLikes(r.data.likesCount); setIsLiked(true)
      }
    } catch {}
  }

  async function handleSave() {
    if (!isAuthed) return router.push('/login')
    try {
      if (isSaved) {
        await api.post(`/api/events/${initial.id}/unsave`); setIsSaved(false)
      } else {
        await api.post(`/api/events/${initial.id}/save`); setIsSaved(true)
      }
    } catch {}
  }

  async function handleAttend(status: AttendanceStatus) {
    if (!isAuthed) return router.push('/login')
    try {
      if (attendance === status) {
        const r = await api.delete(`/api/events/${initial.id}/attend`)
        setAttendance(null); setGoing(r.data.goingCount); setInterested(r.data.interestedCount)
      } else {
        const r = await api.post(`/api/events/${initial.id}/attend`, { status })
        setAttendance(status); setGoing(r.data.goingCount); setInterested(r.data.interestedCount)
      }
    } catch {}
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true)
    try {
      const r = await api.post(`/api/events/${initial.id}/comments`, { content: commentText })
      setComments(prev => [r.data, ...prev])
      setCommentText('')
    } catch {} finally {
      setCommentLoading(false)
    }
  }

  async function handleCommentLike(commentId: number, liked: boolean) {
    if (!isAuthed) return router.push('/login')
    try {
      if (liked) {
        await api.delete(`/api/events/${initial.id}/comments/${commentId}/like`)
      } else {
        await api.post(`/api/events/${initial.id}/comments/${commentId}/like`)
      }
      setComments(prev => prev.map(c => c.id === commentId
        ? { ...c, currentUserLiked: !liked, likesCount: liked ? c.likesCount - 1 : c.likesCount + 1 }
        : c
      ))
    } catch {}
  }

  async function handleCommentDelete(commentId: number) {
    try {
      await api.delete(`/api/events/${initial.id}/comments/${commentId}`)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {}
  }

  return (
    <>
      {/* Action bar */}
      <div className="groove-page-actions mb-4">
        <Link href="/" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> <span data-i18n="common.back">Назад</span>
        </Link>
        {initial.canEdit && (
          <Link href={`/events/${initial.id}/edit`} className="groove-button groove-button-paper">
            <i className="bi bi-pencil" /> <span data-i18n="org.btn.edit">Редакция</span>
          </Link>
        )}
        {initial.canDelete && (
          <Link href={`/events/${initial.id}/delete`} className="groove-button groove-button-paper">
            <i className="bi bi-trash" /> <span data-i18n="organizer.pages.delete">Изтрий</span>
          </Link>
        )}
        {initial.canManageTickets && (
          <Link href={`/tickets/manage/${initial.id}`} className="groove-button groove-button-dark">
            <i className="bi bi-ticket-perforated" /> <span data-i18n="org.btn.tickets">Билети</span>
          </Link>
        )}
      </div>

      {!initial.isApproved && (
        <div className="groove-alert groove-alert-warning mb-4">
          <strong data-i18n="event.status.waiting.approval">Това събитие чака одобрение.</strong>
        </div>
      )}
      {initial.isApproved && initial.hasPendingChanges && initial.canEdit && (
        <div className="groove-alert groove-alert-warning mb-4">
          <strong>Има изпратени промени за одобрение.</strong>
          <span> Публичната версия остава активна, докато админ ги прегледа.</span>
        </div>
      )}

      {/* Main split layout */}
      <div className="groove-split">
        <article className="groove-paper-card" data-translate-scope>
          {initial.imageUrl && (
            <img
              src={mediaUrl(initial.imageUrl)}
              className="img-fluid rounded mb-3"
              alt={initial.title}
              style={{ maxHeight: 420, width: '100%', objectFit: 'cover' }}
            />
          )}
          {initial.imageUrls.length > 0 && (
            <div className="d-flex gap-2 flex-wrap mb-3">
              {initial.imageUrls.map((url, i) => (
                <img key={i} src={mediaUrl(url)} className="rounded" style={{ height: 80, width: 80, objectFit: 'cover' }} alt="Event image" />
              ))}
            </div>
          )}
          <span className="groove-kicker">{initial.genre}</span>
          <h1 className="groove-panel-title" data-translate-text="event-title">{initial.title}</h1>
          {initial.description && (
            <p className="groove-panel-intro mt-3" data-translate-text="event-description">{initial.description}</p>
          )}
        </article>

        <aside className="groove-info-card">
          <dl className="groove-data-list">
            <dt data-i18n="event.location">Локация</dt>
            <dd>{initial.address}, {initial.city}</dd>
            <dt data-i18n="org.th.start">Начало</dt>
            <dd>{format(new Date(initial.startTime), 'dd.MM.yyyy HH:mm')}</dd>
            <dt data-i18n="ticket.end">Край</dt>
            <dd>{format(new Date(initial.endTime), 'dd.MM.yyyy HH:mm')}</dd>
            <dt data-i18n="profile.public.page">Публична страница</dt>
            <dd>
              {initial.organizerId ? (
                <Link href={`/profile/${initial.organizerId}`} className="groove-link">
                  <i className="bi bi-person-badge" /> {initial.organizerName}
                </Link>
              ) : (
                <span className="text-muted">{initial.organizerName}</span>
              )}
            </dd>
            <dt data-i18n="event.social">Социално</dt>
            <dd>
              {likes} <span data-i18n="social.likes">харесвания</span>{' · '}
              {initial.savesCount} <span data-i18n="social.saves">запазвания</span>
            </dd>
            <dt data-i18n="event.attendance">Посещения</dt>
            <dd>
              {going} <span data-i18n="event.action.going">Отивам</span>{' · '}
              {interested} <span data-i18n="event.action.interested">Интересува ме</span>
            </dd>
          </dl>

          {isAuthed && (
            <>
              <hr />
              <div className="groove-form-actions">
                <button
                  className={`groove-button ${isLiked ? 'groove-button-dark' : 'groove-button-paper'}`}
                  type="button"
                  onClick={handleLike}
                >
                  <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`} />
                  {' '}
                  <span data-i18n={isLiked ? 'post.unlike' : 'post.like'}>
                    {isLiked ? 'Премахни харесване' : 'Харесай'}
                  </span>
                </button>

                <button
                  className="groove-button groove-button-paper"
                  type="button"
                  onClick={handleSave}
                >
                  <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`} />
                  {' '}
                  <span data-i18n={isSaved ? 'post.unsave' : 'post.save'}>
                    {isSaved ? 'Премахни запазване' : 'Запази'}
                  </span>
                </button>

                <button
                  className={`groove-button ${attendance === 'Going' ? 'groove-button-dark' : 'groove-button-paper'}`}
                  type="button"
                  onClick={() => handleAttend('Going')}
                >
                  <i className="bi bi-check2-circle" />{' '}
                  <span data-i18n="event.action.going">Отивам</span>
                </button>

                <button
                  className={`groove-button ${attendance === 'Interested' ? 'groove-button-dark' : 'groove-button-paper'}`}
                  type="button"
                  onClick={() => handleAttend('Interested')}
                >
                  <i className="bi bi-star" />{' '}
                  <span data-i18n="event.action.interested">Интересува ме</span>
                </button>
              </div>
            </>
          )}

          {!isAuthed && (
            <>
              <hr />
              <div className="groove-form-actions">
                <Link href="/login" className="groove-button groove-button-dark">
                  <i className="bi bi-check2-circle" />{' '}
                  <span data-i18n="event.action.going">Отивам</span>
                </Link>
                <Link href="/login" className="groove-button groove-button-paper">
                  <i className="bi bi-star" />{' '}
                  <span data-i18n="event.action.interested">Интересува ме</span>
                </Link>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Occurrences */}
      {initial.isRecurring && initial.occurrences.length > 0 && (
        <section className="groove-page-section event-occurrence-selector">
          <div className="groove-section-bar">
            <div>
              <span className="groove-kicker" data-i18n="event.dates.kicker">Дати</span>
              <h2>Избери дата.</h2>
            </div>
          </div>
          <div className="groove-info-card event-occurrence-card">
            <div className="event-occurrence-pills" aria-label="Избор на дата">
              {initial.occurrences.slice(0, 8).map(occ => (
                <Link
                  key={occ.id}
                  href={`/events/${initial.id}?occurrenceId=${occ.id}`}
                  className={`event-occurrence-pill ${occ.status === 'Cancelled' ? 'is-cancelled' : occ.status === 'SoldOut' ? 'is-soldout' : ''}`}
                >
                  <span>{format(new Date(occ.startDateTime), 'EEE, dd.MM')}</span>
                  <strong>{format(new Date(occ.startDateTime), 'HH:mm')}</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tickets */}
      <section className="groove-page-section">
        <div className="groove-section-bar">
          <div>
            <span className="groove-kicker" data-i18n="org.btn.tickets">Билети</span>
            <h2 data-i18n-html="tickets.available">Налични <span>билети</span>.</h2>
          </div>
          {initial.canManageTickets && (
            <Link href={`/tickets/create/${initial.id}`} className="groove-button groove-button-paper">
              <i className="bi bi-plus-lg" /> <span data-i18n="tickets.add">Добави билет</span>
            </Link>
          )}
        </div>

        {initial.tickets.length === 0 ? (
          <div className="groove-empty-card">
            <i className="bi bi-ticket-perforated" />
            <h2 className="groove-panel-title" data-i18n="ticket.none">Все още няма билети.</h2>
          </div>
        ) : (
          <div className="groove-ticket-grid mb-3">
            {initial.tickets.map(t => (
              <article key={t.id} className="groove-ticket-card">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <h3>{t.name}</h3>
                  {t.availableCount !== undefined && (
                    <span className={`groove-status-badge ${t.availableCount === 0 ? 'groove-status-badge-danger' : 'groove-status-badge-success'}`}>
                      {t.availableCount === 0
                        ? <span data-i18n="ticket.soldout">Разпродадено</span>
                        : <><span>{t.availableCount}</span> <span data-i18n="ticket.left">оставащи</span></>
                      }
                    </span>
                  )}
                </div>
                {t.description && <p>{t.description}</p>}
                <div className="groove-ticket-footer">
                  <span className="groove-price">
                    {t.price === 0 ? 'Безплатно' : `${t.price} ${t.currency}`}
                  </span>
                  {isAuthed ? (
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      const quantity = Number(new FormData(e.currentTarget).get('quantity') ?? 1)
                      try {
                        await api.post(`/api/tickets/${t.id}/buy`, { quantity })
                        router.push('/tickets')
                      } catch {}
                    }}>
                      <select name="quantity" className="form-select form-select-sm groove-ticket-quantity" aria-label="Брой билети">
                        {[1,2,3,4,5].map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                      <button className="groove-button groove-button-dark" type="submit">
                        <i className="bi bi-cart-plus" />{' '}
                        <span data-i18n="ticket.buy">{t.price === 0 ? 'Вземи' : 'Купи'}</span>
                      </button>
                    </form>
                  ) : (
                    <Link href="/login" className="groove-button groove-button-dark">
                      <i className="bi bi-cart-plus" />{' '}
                      <span data-i18n="ticket.buy">{t.price === 0 ? 'Вземи' : 'Купи'}</span>
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Comments */}
      <section className="groove-page-section">
        <div className="groove-section-bar">
          <div>
            <span className="groove-kicker" data-i18n="comments.kicker">Коментари</span>
            <h2 data-i18n-html="comments.heading">Какво <span>казват</span> хората.</h2>
          </div>
        </div>

        {isAuthed && (
          <form className="social-add-comment mb-4" onSubmit={handleCommentSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Напиши коментар..."
                data-i18n-placeholder="comments.placeholder"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                maxLength={1000}
                required
              />
              <button className="btn btn-primary" type="submit" disabled={commentLoading}>
                <i className="bi bi-send" />
              </button>
            </div>
          </form>
        )}

        {comments.length === 0 ? (
          <div className="groove-empty-card">
            <i className="bi bi-chat-left" />
            <h2 className="groove-panel-title" data-i18n="comments.empty">Все още няма коментари.</h2>
          </div>
        ) : (
          <div className="social-comments-list">
            {comments.map(c => (
              <article key={c.id} className="social-comment-item">
                {c.authorImageUrl ? (
                  <img src={mediaUrl(c.authorImageUrl)} alt={c.userName} className="social-avatar-xs" />
                ) : (
                  <span className="social-avatar-xs social-avatar-xs--fallback">
                    {(c.userName?.[0] ?? '?').toUpperCase()}
                  </span>
                )}
                <div>
                  <strong>{c.userName}</strong>
                  <p className="groove-list-meta mt-1">{format(new Date(c.createdAt), 'dd.MM.yyyy HH:mm')}</p>
                  <p>{c.content}</p>
                  <div className="social-comment-toolbar">
                    <button
                      className={`comment-like-button ${c.currentUserLiked ? 'is-liked' : ''}`}
                      type="button"
                      onClick={() => handleCommentLike(c.id, c.currentUserLiked)}
                    >
                      <i className={`bi ${c.currentUserLiked ? 'bi-heart-fill' : 'bi-heart'}`} />
                      <span>{c.likesCount}</span>
                    </button>
                  </div>

                  {/* Replies */}
                  {c.replies.length > 0 && (
                    <div className="social-comment-replies">
                      {c.replies.map(r => (
                        <article key={r.id} className="social-comment-reply-item">
                          {r.authorImageUrl ? (
                            <img src={mediaUrl(r.authorImageUrl)} alt={r.userName} className="social-avatar-xs" />
                          ) : (
                            <span className="social-avatar-xs social-avatar-xs--fallback">
                              {(r.userName?.[0] ?? '?').toUpperCase()}
                            </span>
                          )}
                          <div className="social-comment-reply-item__body">
                            <strong>{r.userName}</strong>
                            <p className="groove-list-meta mt-1">{format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm')}</p>
                            <p>{r.content}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
                {c.canDelete && (
                  <button
                    className="groove-button groove-button-paper ms-2"
                    type="button"
                    onClick={() => handleCommentDelete(c.id)}
                  >
                    <i className="bi bi-trash" />
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Similar events */}
      {initial.similarEvents.length > 0 && (
        <section className="evt-similar">
          <h2 data-i18n="event.similar">Сходни събития</h2>
          <div className="evt-similar__grid">
            {initial.similarEvents.map(ev => (
              <Link key={ev.id} href={`/events/${ev.id}`} className="evt-trending__row">
                {ev.imageUrl ? (
                  <img src={mediaUrl(ev.imageUrl)} alt={ev.title} />
                ) : (
                  <span className="evt-trending__placeholder"><i className="bi bi-calendar-event" /></span>
                )}
                <div className="evt-trending__body">
                  <strong>{ev.title}</strong>
                  <small>{ev.city} · {format(new Date(ev.startTime), 'dd.MM HH:mm')}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
