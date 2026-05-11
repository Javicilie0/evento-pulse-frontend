import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Conversation } from '@/types/api'

async function getConversations(): Promise<Conversation[]> {
  try {
    const res = await (await authenticatedServerApi()).get<Conversation[]>('/api/messages/conversations')
    return res.data
  } catch {
    return []
  }
}

export default async function InboxPage() {
  const conversations = await getConversations()

  return (
    <section className="groove-app-page social-messages-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal" data-i18n="nav.messages">Messages</span>
          <h1 data-i18n-html="messages.index.title">Direct <span>messages</span>.</h1>
          <p data-i18n="messages.index.desc">
            Personal chats stay personal. Page inboxes are separated for organizers.
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="groove-empty-card mt-4">
          <i className="bi bi-chat-square-text" />
          <h2 className="groove-panel-title" data-i18n="messages.empty">Няма съобщения.</h2>
          <p className="groove-panel-intro" data-i18n="messages.empty.desc">
            Намери събитие или организатор и изпрати съобщение.
          </p>
          <Link href="/" className="groove-button groove-button-dark mt-3">
            <i className="bi bi-search" /> <span>Разгледай</span>
          </Link>
        </div>
      ) : (
        <div className="social-message-list mt-4">
          {conversations.map(c => (
            <Link key={c.token} href={`/inbox/${c.token}`} className="social-message-row">
              <span className="social-avatar-xs social-avatar-xs--fallback">
                {(c.otherUserName?.[0] ?? '?').toUpperCase()}
              </span>
              <div className="social-message-row__body">
                <strong>{c.otherUserName}</strong>
                {c.lastMessage && <p className="text-muted small mb-0 text-truncate">{c.lastMessage}</p>}
              </div>
              <div className="social-message-row__meta">
                {c.lastMessageAt && (
                  <small className="text-muted">{format(new Date(c.lastMessageAt), 'dd.MM HH:mm')}</small>
                )}
                {c.unreadCount > 0 && (
                  <span className="badge bg-primary rounded-pill">{c.unreadCount}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
