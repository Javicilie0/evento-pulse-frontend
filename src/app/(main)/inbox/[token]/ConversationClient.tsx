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

export function ConversationClient({ conversation }: { conversation: ConversationDetail }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>(conversation.messages)
  const [status, setStatus] = useState(conversation.status)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastMessageId = useRef<number>(0)

  const displayName = conversation.isPageConversation && !conversation.currentUserOwnsPage
    ? conversation.pageName ?? conversation.otherUserName
    : conversation.otherUserName

  const displayImage = conversation.isPageConversation && !conversation.currentUserOwnsPage
    ? conversation.pageImageUrl ?? conversation.otherUserImageUrl
    : conversation.otherUserImageUrl

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (threadRef.current) {
        threadRef.current.scrollTop = threadRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (messages.length > 0) {
      lastMessageId.current = messages[messages.length - 1].id
    }
  }, [])

  // SignalR real-time connection
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
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev
        lastMessageId.current = message.id
        return [...prev, message]
      })
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
      const res = await api.post<Message>(`/api/messages/conversations/${conversation.token}`, { content: text })
      setMessages(prev => {
        const next = [...prev, res.data]
        lastMessageId.current = res.data.id
        return next
      })
      setContent('')
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

  function startEdit(message: Message) {
    setEditingId(message.id)
    setEditContent(message.content)
    setDeletingId(null)
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

  const isMine = (msg: Message) => msg.senderId === session?.user?.id

  return (
    <section className="groove-app-page social-messages-page social-messages-page--chat">
      <div className="social-chat-shell" data-current-conversation-token={conversation.token}>

        {/* Header */}
        <header className="social-chat-header">
          <Link href="/inbox" className="groove-button groove-button-paper groove-button--sm" title="Назад">
            <i className="bi bi-arrow-left" />
          </Link>
          <Link href={conversation.isPageConversation && conversation.organizerProfileId
            ? `/pages/${conversation.organizerProfileId}`
            : `/profile/${conversation.otherUserId}`
          } className="social-author-link">
            <Avatar name={displayName} imageUrl={displayImage} />
            <span>
              <strong>{displayName}</strong>
              <small className={status === 'Accepted' ? 'text-success' : status === 'Declined' ? 'text-danger' : 'text-muted'}>
                {status === 'Accepted' ? 'Активен' : status === 'Declined' ? 'Отказан' : 'Заявка чака'}
              </small>
            </span>
          </Link>
        </header>

        {/* Thread */}
        <div className="social-chat-thread" ref={threadRef}>
          {status === 'Pending' && (
            <div className="social-message-request is-actionable">
              <strong>Заявка за съобщения</strong>
              <p>Разговорът чака одобрение. След одобрение чатът продължава нормално.</p>
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
            <div className="social-message-request">
              <strong>Заявката е отказана</strong>
              <p>Този разговор не е активен.</p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-chat-dots" style={{ fontSize: '2rem' }} />
              <p className="mt-2">Няма съобщения. Напиши първото.</p>
            </div>
          ) : messages.map(message => (
            <article
              key={message.id}
              className={`social-message-bubble ${isMine(message) ? 'is-mine' : ''} ${message.isDeleted ? 'is-deleted' : ''}`}
              id={`message-${message.id}`}
            >
              {!isMine(message) && (
                <Avatar name={message.senderName} imageUrl={message.senderImageUrl} />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {!isMine(message) && (
                  <div className="social-message-bubble__head">
                    <strong className="small">{message.senderName}</strong>
                  </div>
                )}

                {editingId === message.id ? (
                  <div className="social-message-bubble__edit">
                    <textarea
                      className="form-control"
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={2}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(message.id) }
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                    <div className="social-message-bubble__edit-actions">
                      <button className="groove-button groove-button-dark groove-button--sm" type="button" onClick={() => submitEdit(message.id)}>
                        <i className="bi bi-check2" /> Запази
                      </button>
                      <button className="groove-button groove-button-paper groove-button--sm" type="button" onClick={() => setEditingId(null)}>
                        <i className="bi bi-x-lg" /> Откажи
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>
                    {message.isDeleted
                      ? <em className="text-muted"><i className="bi bi-trash" /> Съобщението беше изтрито</em>
                      : message.content
                    }
                  </p>
                )}

                <small className="social-message-bubble__meta">
                  <span>
                    <i className="bi bi-clock" /> {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm')}
                    {message.editedAt && ' · редактирано'}
                  </span>
                </small>

                {/* Action row */}
                {!message.isDeleted && editingId !== message.id && (
                  <div className="groove-form-actions mt-1" style={{ gap: '4px' }}>
                    <button
                      className={`groove-button groove-button-paper groove-button--sm ${message.currentUserLiked ? 'groove-button-dark' : ''}`}
                      type="button"
                      onClick={() => toggleLike(message)}
                    >
                      <i className={`bi ${message.currentUserLiked ? 'bi-heart-fill' : 'bi-heart'}`} />
                      {(message.likesCount ?? 0) > 0 && <span>{message.likesCount}</span>}
                    </button>

                    {isMine(message) && message.canEdit && (
                      <button
                        className="groove-button groove-button-paper groove-button--sm"
                        type="button"
                        onClick={() => startEdit(message)}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                    )}

                    {isMine(message) && message.canDelete && deletingId === message.id ? (
                      <>
                        <button
                          className="groove-button groove-button--sm text-danger"
                          type="button"
                          style={{ background: '#fff3f3', borderColor: '#fca5a5' }}
                          onClick={() => deleteMessage(message.id)}
                        >
                          <i className="bi bi-trash" /> Потвърди
                        </button>
                        <button
                          className="groove-button groove-button-paper groove-button--sm"
                          type="button"
                          onClick={() => setDeletingId(null)}
                        >
                          Откажи
                        </button>
                      </>
                    ) : isMine(message) && message.canDelete ? (
                      <button
                        className="groove-button groove-button-paper groove-button--sm"
                        type="button"
                        onClick={() => { setDeletingId(message.id); setEditingId(null) }}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Compose */}
        <form className="social-chat-compose" onSubmit={sendMessage}>
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={2000}
            placeholder="Напиши съобщение..."
            disabled={status === 'Declined'}
            required
          />
          <button
            type="submit"
            className="groove-button groove-button-dark"
            disabled={sending || status === 'Declined'}
          >
            {sending
              ? <span className="spinner-border spinner-border-sm" />
              : <i className="bi bi-send" />
            }
            <span>Изпрати</span>
          </button>
        </form>
      </div>
    </section>
  )
}
