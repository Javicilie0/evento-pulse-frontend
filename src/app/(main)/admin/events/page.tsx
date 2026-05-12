import { authenticatedServerApi } from '@/lib/serverApi'
import { AdminEventsClient, type AdminEvent } from './AdminEventsClient'

interface Props {
  searchParams: Promise<{ pending?: string }>
}

export default async function AdminEventsPage({ searchParams }: Props) {
  const sp = await searchParams
  const pendingOnly = sp.pending === 'true'

  const sapi = await authenticatedServerApi()
  let events: AdminEvent[] = []
  try {
    const res = await sapi.get<AdminEvent[]>('/api/admin/events' + (pendingOnly ? '?pending=true' : ''))
    events = res.data
  } catch {}

  return <AdminEventsClient initialEvents={events} pendingOnly={pendingOnly} />
}
