import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import { ConversationClient } from './ConversationClient'

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

  return <ConversationClient conversation={convo} />
}
