import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Conversation } from '@/types/api'
import { InboxBoard } from './InboxBoard'

async function getConversations(): Promise<Conversation[]> {
  try {
    const res = await (await authenticatedServerApi()).get<Conversation[]>('/api/messages/conversations')
    return res.data
  } catch {
    return []
  }
}

export default async function InboxPage({ searchParams }: { searchParams?: Promise<{ userId?: string; pageId?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  if (sp?.userId) {
    try {
      const res = await (await authenticatedServerApi()).post<{ token: string }>('/api/messages/conversations', { userId: sp.userId })
      redirect(`/inbox/${res.data.token}`)
    } catch {
      redirect('/inbox')
    }
  }
  if (sp?.pageId) {
    try {
      const res = await (await authenticatedServerApi()).post<{ token: string }>('/api/messages/conversations/page', { organizerProfileId: Number(sp.pageId) })
      redirect(`/inbox/${res.data.token}`)
    } catch {
      redirect('/inbox')
    }
  }

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
        <InboxBoard conversations={conversations} />
      )}
    </section>
  )
}
