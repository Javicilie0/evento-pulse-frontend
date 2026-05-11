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
              <small>{conversation.status}</small>
            </span>
          </Link>
        </header>

        <div className="social-chat-thread">
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
                  <p>{message.content}</p>
                  <small className="social-message-bubble__meta">
                    <span><i className="bi bi-clock" /> Изпратено {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm')}</span>
                  </small>
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
          <button type="submit" className="groove-button groove-button-dark" disabled={sending}>
            {sending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send" />}
            <span>Изпрати</span>
          </button>
        </form>
      </div>
    </section>
  )
}
