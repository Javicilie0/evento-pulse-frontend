'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { useSession } from 'next-auth/react'

interface Message {
  id: number
  content: string
  senderId: string
  senderName?: string
  createdAt: string
  editedAt?: string
  isDeleted?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

interface ConversationDetail {
  token: string
  otherUserId: string
  otherUserName: string
  otherUserImageUrl?: string
  status: string
  messages: Message[]
}

export function ConversationClient({ conversation }: { conversation: ConversationDetail }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>(conversation.messages)
  const [status, setStatus] = useState(conversation.status)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const initial = (conversation.otherUserName?.[0] ?? '?').toUpperCase()

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text || sending) return

    setSending(true)
    try {
      const res = await api.post<Message>(`/api/messages/conversations/${conversation.token}`, { content: text })
      setMessages(prev => [...prev, res.data])
      setContent('')
    } finally {
      setSending(false)
    }
  }

  async function setConversationStatus(next: 'approve' | 'decline') {
    const res = await api.post(`/api/messages/conversations/${conversation.token}/${next}`)
    setStatus(res.data.status)
  }

  async function editMessage(message: Message) {
    const next = prompt('Редактирай съобщението', message.content)
    if (next == null || !next.trim()) return
    const res = await api.put(`/api/messages/messages/${message.id}`, { content: next.trim() })
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, content: res.data.content, editedAt: res.data.editedAt } : m))
  }

  async function deleteMessage(id: number) {
    if (!confirm('Изтриване на това съобщение?')) return
    await api.delete(`/api/messages/messages/${id}`)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: '', isDeleted: true, canEdit: false, canDelete: false } : m))
  }

  return (
    <section className="groove-app-page social-messages-page social-messages-page--chat">
      <div className="social-chat-shell" data-current-conversation-token={conversation.token}>
        <header className="social-chat-header">
          <Link href="/inbox" className="btn btn-sm btn-outline-secondary" title="Назад">
            <i className="bi bi-arrow-left" />
          </Link>
          <Link href={`/profile/${conversation.otherUserId}`} className="social-author-link">
            {conversation.otherUserImageUrl ? (
              <img src={conversation.otherUserImageUrl} alt={conversation.otherUserName} className="social-avatar-xs" />
            ) : (
              <span className="social-avatar-xs social-avatar-xs--fallback">{initial}</span>
            )}
            <span>
              <strong>{conversation.otherUserName}</strong>
              <small>{status}</small>
            </span>
          </Link>
        </header>

        <div className="social-chat-thread">
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
          ) : (
            messages.map(message => {
              const isMine = message.senderId === session?.user?.id
              return (
                <article
                  key={message.id}
                  className={`social-message-bubble ${isMine ? 'is-mine' : ''}`}
                  id={`message-${message.id}`}
                  data-message-id={message.id}
                >
                  <div className="social-message-bubble__head">
                    <strong className="small">{message.senderName}</strong>
                  </div>
                  <p>{message.isDeleted ? <em>Това съобщение беше изтрито</em> : message.content}</p>
                  <small className="social-message-bubble__meta">
                    <span><i className="bi bi-clock" /> Изпратено {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm')}{message.editedAt ? ' · редактирано' : ''}</span>
                  </small>
                  {isMine && !message.isDeleted && (
                    <div className="groove-form-actions mt-2">
                      <button className="groove-button groove-button-paper groove-button--sm" type="button" onClick={() => editMessage(message)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="groove-button groove-button-paper groove-button--sm text-danger" type="button" onClick={() => deleteMessage(message.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>

        <form className="social-chat-compose" onSubmit={sendMessage}>
          <input
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={2000}
            placeholder="Напиши съобщение..."
            required
          />
          <button type="submit" className="groove-button groove-button-dark" disabled={sending || status === 'Declined'}>
            {sending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send" />}
            <span>Изпрати</span>
          </button>
        </form>
      </div>
    </section>
  )
}
