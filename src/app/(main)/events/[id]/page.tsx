import { authenticatedServerApi } from '@/lib/serverApi'
import { notFound } from 'next/navigation'
import type { EventDetails } from '@/types/api'
import { EventDetailsClient } from './EventDetailsClient'
import type { Metadata } from 'next'
import { mediaUrl } from '@/lib/media'

async function getEvent(id: string): Promise<EventDetails | null> {
  try {
    const res = await (await authenticatedServerApi()).get<EventDetails>(`/api/events/${id}`)
    return res.data
  } catch {
    return null
  }
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) return { title: 'Събитие не е намерено' }
  return {
    title: `${event.title} — Evento`,
    description: event.description?.slice(0, 200) ?? `${event.city} · ${event.startTime}`,
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 200) ?? `${event.city}`,
      images: event.imageUrl ? [mediaUrl(event.imageUrl)!] : [],
    },
  }
}

export default async function EventDetailsPage({ params }: Props) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) return notFound()

  return (
    <section className="groove-app-page">
      <EventDetailsClient event={event} />
    </section>
  )
}
