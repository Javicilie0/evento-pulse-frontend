import { authenticatedServerApi } from '@/lib/serverApi'
import { AdminUsersClient, type AdminUser } from './AdminUsersClient'

export default async function AdminUsersPage() {
  const sapi = await authenticatedServerApi()
  let users: AdminUser[] = []
  try {
    const res = await sapi.get<AdminUser[]>('/api/admin/users')
    users = res.data
  } catch {}

  return <AdminUsersClient initialUsers={users} />
}
