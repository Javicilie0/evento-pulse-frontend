import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import type { EventDetails } from '@/types/api'
import { EditEventClient } from './EditEventClient'

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

export default async function EditEventPage({ params }: Props) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event || !event.canEdit) return notFound()
  return <EditEventClient event={event} />
}
