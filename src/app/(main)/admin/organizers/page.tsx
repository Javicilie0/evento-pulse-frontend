import { authenticatedServerApi } from '@/lib/serverApi'
import { AdminOrganizersClient, type OrganizerRow } from './AdminOrganizersClient'

export default async function AdminOrganizersPage() {
  const sapi = await authenticatedServerApi()
  let organizers: OrganizerRow[] = []
  try {
    const res = await sapi.get<OrganizerRow[]>('/api/admin/organizers')
    organizers = res.data
  } catch {}

  return <AdminOrganizersClient initialOrganizers={organizers} />
}
