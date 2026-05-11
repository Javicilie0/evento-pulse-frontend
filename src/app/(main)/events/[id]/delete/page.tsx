import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import type { EventDetails } from '@/types/api'
import { DeleteEventClient } from './DeleteEventClient'

interface Props {
  params: Promise<{ id: string }>
}

async function getEvent(id: string) {
  try {
    const res = await (await authenticatedServerApi()).get<EventDetails>(`/api/events/${id}`)
    return res.data
  } catch {
    return null
  }
}

export default async function DeleteEventPage({ params }: Props) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event || !event.canDelete) return notFound()
  return <DeleteEventClient id={event.id} title={event.title} />
}
