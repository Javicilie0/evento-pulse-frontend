import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface ConversationDetail {
  token: string
  otherUserId: string
  otherUserName: string
  otherUserImageUrl?: string
  status: string
  messages: Array<{
    id: number
    content: string
    senderId: string
    senderName?: string
    createdAt: string
  }>
}

interface Props {
  params: Promise<{ token: string }>
}

async function getConversation(token: string): Promise<ConversationDetail | null> {
  try {
    const res = await (await authenticatedServerApi()).get<ConversationDetail>(`/api/messages/conversations/${token}`)
    return res.data
  } catch {
    return null
  }
}

export default async function ConversationPage({ params }: Props) {
  const { token } = await params
  const convo = await getConversation(token)
  if (!convo) return notFound()

  return (
    <section className="groove-app-page social-messages-page">
      <div className="groove-page-actions mb-3">
        <Link href="/inbox" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> <span data-i18n="common.back">Назад</span>
        </Link>
        <strong className="ms-2">{convo.otherUserName}</strong>
      </div>

      <div className="social-chat-messages">
        {convo.messages.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-chat-dots" style={{ fontSize: '2rem' }} />
            <p className="mt-2" data-i18n="messages.empty">Няма съобщения. Напиши първото!</p>
          </div>
        ) : (
          convo.messages.map(msg => (
            <div key={msg.id} className={`social-chat-message ${msg.senderId === convo.otherUserId ? '' : 'social-chat-message--own'}`}>
              <div className="social-chat-message__bubble">
                <p className="mb-1">{msg.content}</p>
                <small className="text-muted">{format(new Date(msg.createdAt), 'dd.MM HH:mm')}</small>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="social-chat-composer mt-3" method="POST" action={`/api/messages/conversations/${token}`}>
        <div className="input-group">
          <input
            type="text"
            name="content"
            className="form-control"
            placeholder="Напиши съобщение..."
            data-i18n-placeholder="messages.input.placeholder"
            maxLength={2000}
            required
          />
          <button className="btn btn-primary" type="submit">
            <i className="bi bi-send" />
          </button>
        </div>
      </form>
    </section>
  )
}
