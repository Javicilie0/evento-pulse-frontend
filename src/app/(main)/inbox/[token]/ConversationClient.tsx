'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { api } from '@/lib/api'
import { useSession } from 'next-auth/react'
import { getSession } from 'next-auth/react'

interface Message {
  id: number
  content: string
  senderId: string
  senderName?: string
  senderImageUrl?: string
  createdAt: string
  editedAt?: string
  isDeleted?: boolean
  likesCount?: number
  currentUserLiked?: boolean
  canEdit?: boolean
  canDelete?: boolean
  replyToId?: number
  replyToContent?: string
  replyToSenderName?: string
}

interface ConversationDetail {
  token: string
  otherUserId: string
  otherUserName: string
  otherUserImageUrl?: string
  organizerProfileId?: number
  pageName?: string
  pageImageUrl?: string
  currentUserOwnsPage?: boolean
  isPageConversation?: boolean
  status: string
  messages: Message[]
}

function Avatar({ name, imageUrl, size = 'xs' }: { name?: string; imageUrl?: string; size?: 'xs' | 'sm' }) {
  const cls = `social-avatar-${size}`
  const initial = (name?.[0] ?? '?').toUpperCase()
  return imageUrl ? (
    <img src={imageUrl} alt={name ?? ''} className={cls} />
  ) : (
    <span className={`${cls} social-avatar-${size}--fallback`}>{initial}</span>
  )
}

function MessageBubble({
  message,
  isMine,
  openMenuId,
  editingId,
  editContent,
  deletingId,
  onToggleLike,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  onSetDeleting,
  onDelete,
  onReply,
  onOpenMenu,
  onCloseMenu,
  setEditContent,
}: {
  message: Message
  isMine: boolean
  openMenuId: number | null
  editingId: number | null
  editContent: string
  deletingId: number | null
  onToggleLike: (m: Message) => void
  onStartEdit: (m: Message) => void
  onSubmitEdit: (id: number) => void
  onCancelEdit: () => void
  onSetDeleting: (id: number) => void
  onDelete: (id: number) => void
  onReply: (m: Message) => void
  onOpenMenu: (id: number) => void
  onCloseMenu: () => void
  setEditContent: (v: string) => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const menuOpen = openMenuId === message.id

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onCloseMenu()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen, onCloseMenu])

  return (
    <article
      key={message.id}
      id={`message-${message.id}`}
      className={`social-message-bubble ${isMine ? 'is-mine' : ''} ${message.isDeleted ? 'is-deleted' : ''}`}
      style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: '0.5rem', alignItems: 'flex-end', maxWidth: '100%', background: 'none', border: 'none', padding: 0, boxShadow: 'none' }}
    >
      {/* Avatar for other user */}
      {!isMine && (
        <div style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
          <Avatar name={message.senderName} imageUrl={message.senderImageUrl} />
        </div>
      )}

      {/* Bubble body */}
      <div style={{ maxWidth: 'min(78%, 520px)', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: '2px' }}>

        {/* Sender name (only for others, group chats) */}
        {!isMine && (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--social-muted, #5b6275)', paddingLeft: '0.5rem' }}>
            {message.senderName}
          </span>
        )}

        <div style={{ position: 'relative' }}>
          {/* Bubble */}
          <div style={{
            padding: '0.6rem 0.85rem',
            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isMine ? 'var(--evt-accent, #6c5ce7)' : 'var(--social-soft, #f3f4f8)',
            color: isMine ? '#fff' : 'inherit',
            border: isMine ? 'none' : '1px solid rgba(15,23,42,0.07)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            wordBreak: 'break-word',
          }}>

            {/* Reply quote */}
            {message.replyToContent && !message.isDeleted && (
              <div style={{
                padding: '0.35rem 0.6rem',
                borderLeft: `3px solid ${isMine ? 'rgba(255,255,255,0.5)' : 'var(--evt-accent,#6c5ce7)'}`,
                background: isMine ? 'rgba(255,255,255,0.15)' : 'rgba(108,92,231,0.07)',
                borderRadius: '6px',
                marginBottom: '0.45rem',
                fontSize: '0.82rem',
                opacity: 0.9,
                cursor: 'pointer',
              }}
                onClick={() => {
                  document.getElementById(`message-${message.replyToId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                <strong style={{ display: 'block', fontSize: '0.75rem', marginBottom: '2px', color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--evt-accent,#6c5ce7)' }}>
                  {message.replyToSenderName}
                </strong>
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: isMine ? 'rgba(255,255,255,0.75)' : 'var(--social-muted)' }}>
                  {message.replyToContent}
                </span>
              </div>
            )}

            {/* Edit mode */}
            {editingId === message.id ? (
              <div className="social-message-bubble__edit">
                <textarea
                  className="form-control"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={2}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmitEdit(message.id) }
                    if (e.key === 'Escape') onCancelEdit()
                  }}
                />
                <div className="social-message-bubble__edit-actions">
                  <button className="groove-button groove-button-dark groove-button--sm" type="button" onClick={() => onSubmitEdit(message.id)}>
                    <i className="bi bi-check2" /> Запази
                  </button>
                  <button className="groove-button groove-button-paper groove-button--sm" type="button" onClick={onCancelEdit}>
                    <i className="bi bi-x-lg" /> Откажи
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.45 }}>
                {message.isDeleted
                  ? <em style={{ opacity: 0.65, fontSize: '0.88rem' }}><i className="bi bi-trash" /> Съобщението беше изтрито</em>
                  : message.content
                }
              </p>
            )}
          </div>

          {/* Like reaction badge */}
          {!message.isDeleted && (message.likesCount ?? 0) > 0 && (
            <div
              onClick={() => onToggleLike(message)}
              style={{
                position: 'absolute',
                bottom: '-10px',
                right: isMine ? 'auto' : '-4px',
                left: isMine ? '-4px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: '#fff',
                border: '1.5px solid #eee',
                borderRadius: '999px',
                padding: '2px 7px 2px 5px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                userSelect: 'none',
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>{message.currentUserLiked ? '❤️' : '🤍'}</span>
              {message.likesCount}
            </div>
          )}
        </div>

        {/* Timestamp + meta */}
        {editingId !== message.id && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingInline: '0.3rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--social-muted, #5b6275)' }}>
              {format(new Date(message.createdAt), 'HH:mm')}
              {message.editedAt && ' · ред.'}
            </span>

            {/* Like button (when no likes yet) */}
            {!message.isDeleted && (message.likesCount ?? 0) === 0 && (
              <button
                type="button"
                onClick={() => onToggleLike(message)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 2px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  opacity: message.currentUserLiked ? 1 : 0.4,
                  color: message.currentUserLiked ? '#e74c3c' : 'inherit',
                  transition: 'opacity .15s',
                }}
                title="Харесай"
              >
                <i className={`bi ${message.currentUserLiked ? 'bi-heart-fill' : 'bi-heart'}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ⋯ Menu */}
      {!message.isDeleted && editingId !== message.id && (
        <div ref={menuRef} className="social-message-bubble__menu" style={{ alignSelf: 'center', flexShrink: 0 }}>
          <button
            type="button"
            className="social-message-bubble__menu-trigger"
            onClick={() => menuOpen ? onCloseMenu() : onOpenMenu(message.id)}
            title="Действия"
          >
            <i className="bi bi-three-dots" />
          </button>

          {menuOpen && (
            <div className="social-message-bubble__menu-pop" style={{ [isMine ? 'right' : 'left']: 0, [isMine ? 'left' : 'right']: 'auto' }}>
              {/* Reply — available on ALL messages */}
              <button
                type="button"
                className="social-message-bubble__menu-item"
                onClick={() => { onReply(message); onCloseMenu() }}
              >
                <i className="bi bi-reply" /> Отговори
              </button>

              {/* Like */}
              <button
                type="button"
                className="social-message-bubble__menu-item"
                onClick={() => { onToggleLike(message); onCloseMenu() }}
              >
                <i className={`bi ${message.currentUserLiked ? 'bi-heart-fill' : 'bi-heart'}`} />
                {message.currentUserLiked ? 'Премахни харесване' : 'Харесай'}
              </button>

              {/* Edit — only mine */}
              {isMine && message.canEdit && (
                <button
                  type="button"
                  className="social-message-bubble__menu-item"
                  onClick={() => { onStartEdit(message); onCloseMenu() }}
                >
                  <i className="bi bi-pencil" /> Редактирай
                </button>
              )}

              {/* Delete — only mine */}
              {isMine && message.canDelete && (
                deletingId === message.id ? (
                  <>
                    <button
                      type="button"
                      className="social-message-bubble__menu-item social-message-bubble__menu-item--danger"
                      onClick={() => { onDelete(message.id); onCloseMenu() }}
                    >
                      <i className="bi bi-check2" /> Потвърди изтриване
                    </button>
                    <button
                      type="button"
                      className="social-message-bubble__menu-item"
                      onClick={() => onSetDeleting(-1)}
                    >
                      <i className="bi bi-x-lg" /> Откажи
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="social-message-bubble__menu-item social-message-bubble__menu-item--danger"
                    onClick={() => { onSetDeleting(message.id); }}
                  >
                    <i className="bi bi-trash" /> Изтрий
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export function ConversationClient({ conversation }: { conversation: ConversationDetail }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>(conversation.messages)
  const [status, setStatus] = useState(conversation.status)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayName = conversation.isPageConversation && !conversation.currentUserOwnsPage
    ? conversation.pageName ?? conversation.otherUserName
    : conversation.otherUserName

  const displayImage = conversation.isPageConversation && !conversation.currentUserOwnsPage
    ? conversation.pageImageUrl ?? conversation.otherUserImageUrl
    : conversation.otherUserImageUrl

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
    })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // SignalR
  useEffect(() => {
    const SIGNALR_URL = process.env.NEXT_PUBLIC_SIGNALR_URL ?? 'http://localhost:7180/hubs/chat'
    const connection = new HubConnectionBuilder()
      .withUrl(SIGNALR_URL, {
        accessTokenFactory: async () => {
          const s = await getSession()
          return (s as any)?.accessToken ?? ''
        },
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('ReceiveMessage', (message: Message) => {
      setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message])
    })

    connection.on('MessageLiked', (data: { messageId: number; likesCount: number }) => {
      setMessages(prev => prev.map(m =>
        m.id === data.messageId ? { ...m, likesCount: data.likesCount } : m
      ))
    })

    connection.start()
      .then(() => connection.invoke('JoinConversation', conversation.token))
      .catch(() => {})

    return () => {
      connection.invoke('LeaveConversation', conversation.token).catch(() => {})
      connection.stop()
    }
  }, [conversation.token])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const body: Record<string, unknown> = { content: text }
      if (replyingTo) body.replyToMessageId = replyingTo.id
      const res = await api.post<Message>(`/api/messages/conversations/${conversation.token}`, body)
      setMessages(prev => [...prev, res.data])
      setContent('')
      setReplyingTo(null)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  async function setConversationStatus(next: 'approve' | 'decline') {
    try {
      const res = await api.post(`/api/messages/conversations/${conversation.token}/${next}`)
      setStatus(res.data.status)
    } catch {}
  }

  async function submitEdit(id: number) {
    const trimmed = editContent.trim()
    if (!trimmed) return
    try {
      const res = await api.put(`/api/messages/messages/${id}`, { content: trimmed })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: res.data.content, editedAt: res.data.editedAt } : m))
    } catch {}
    setEditingId(null)
  }

  async function deleteMessage(id: number) {
    try {
      await api.delete(`/api/messages/messages/${id}`)
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: '', isDeleted: true, canEdit: false, canDelete: false } : m))
    } catch {}
    setDeletingId(null)
  }

  async function toggleLike(message: Message) {
    try {
      if (message.currentUserLiked) {
        const res = await api.delete(`/api/messages/messages/${message.id}/like`)
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, likesCount: res.data.likesCount, currentUserLiked: false } : m))
      } else {
        const res = await api.post(`/api/messages/messages/${message.id}/like`)
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, likesCount: res.data.likesCount, currentUserLiked: true } : m))
      }
    } catch {}
  }

  function startReply(message: Message) {
    setReplyingTo(message)
    setEditingId(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const isMine = (msg: Message) => msg.senderId === session?.user?.id

  return (
    <section className="groove-app-page social-messages-page social-messages-page--chat" style={{ paddingTop: '0.5rem' }}>
      <div className="social-chat-shell" data-current-conversation-token={conversation.token}>

        {/* Header */}
        <header className="social-chat-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/inbox" className="groove-button groove-button-paper groove-button--sm" title="Назад" style={{ flexShrink: 0 }}>
            <i className="bi bi-arrow-left" />
          </Link>
          <Link
            href={conversation.isPageConversation && conversation.organizerProfileId
              ? `/pages/${conversation.organizerProfileId}`
              : `/profile/${conversation.otherUserId}`
            }
            className="social-author-link"
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}
          >
            <Avatar name={displayName} imageUrl={displayImage} size="sm" />
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</strong>
              <small className={status === 'Accepted' ? 'text-success' : status === 'Declined' ? 'text-danger' : 'text-muted'} style={{ fontSize: '0.72rem' }}>
                {status === 'Accepted' ? '● Активен' : status === 'Declined' ? '● Отказан' : '⏳ Чака одобрение'}
              </small>
            </span>
          </Link>
        </header>

        {/* Thread */}
        <div className="social-chat-thread" ref={threadRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
          {status === 'Pending' && (
            <div className="social-message-request is-actionable" style={{ margin: '0 auto', maxWidth: 360 }}>
              <strong>Заявка за съобщения</strong>
              <p>Разговорът чака одобрение.</p>
              <div className="groove-cta-row">
                <button className="groove-button groove-button-dark" type="button" onClick={() => setConversationStatus('approve')}>
                  <i className="bi bi-check2" /> Одобри
                </button>
                <button className="groove-button groove-button-paper" type="button" onClick={() => setConversationStatus('decline')}>
                  <i className="bi bi-x-lg" /> Откажи
                </button>
              </div>
            </div>
          )}

          {status === 'Declined' && (
            <div className="social-message-request" style={{ margin: '0 auto', maxWidth: 360, textAlign: 'center' }}>
              <strong>Заявката е отказана</strong>
              <p className="text-muted">Този разговор не е активен.</p>
            </div>
          )}

          {messages.length === 0 && status !== 'Declined' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--social-muted)', padding: '2rem' }}>
              <i className="bi bi-chat-dots" style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Напиши първото съобщение.</p>
            </div>
          ) : messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={isMine(message)}
              openMenuId={openMenuId}
              editingId={editingId}
              editContent={editContent}
              deletingId={deletingId}
              onToggleLike={toggleLike}
              onStartEdit={m => { setEditingId(m.id); setEditContent(m.content); setDeletingId(null) }}
              onSubmitEdit={submitEdit}
              onCancelEdit={() => setEditingId(null)}
              onSetDeleting={id => { setDeletingId(id); }}
              onDelete={deleteMessage}
              onReply={startReply}
              onOpenMenu={id => { setOpenMenuId(id); setDeletingId(null) }}
              onCloseMenu={() => setOpenMenuId(null)}
              setEditContent={setEditContent}
            />
          ))}
        </div>

        {/* Compose */}
        <form className="social-chat-compose" onSubmit={sendMessage}>
          {/* Reply preview */}
          {replyingTo && (
            <div className="social-chat-reply-preview">
              <span>
                <strong style={{ fontSize: '0.78rem' }}>{replyingTo.senderName ?? 'Ти'}</strong>
                <small style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--social-muted)' }}>
                  {replyingTo.content}
                </small>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                title="Затвори отговора"
                aria-label="Затвори"
              >
                <i className="bi bi-x" />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={2000}
            placeholder={replyingTo ? `Отговори на ${replyingTo.senderName ?? 'съобщение'}...` : 'Напиши съобщение...'}
            disabled={status === 'Declined'}
            required
            onKeyDown={e => {
              if (e.key === 'Escape' && replyingTo) { e.preventDefault(); setReplyingTo(null) }
            }}
          />
          <button
            type="submit"
            className="groove-button groove-button-dark"
            disabled={sending || status === 'Declined'}
            style={{ minWidth: 48, minHeight: 48 }}
          >
            {sending
              ? <span className="spinner-border spinner-border-sm" />
              : <i className="bi bi-send-fill" />
            }
          </button>
        </form>
      </div>
    </section>
  )
}
