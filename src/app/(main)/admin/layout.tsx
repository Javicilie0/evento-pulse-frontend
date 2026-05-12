import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  const roles = (session?.user as any)?.roles as string[] | undefined
  if (!session || !roles?.includes('Admin')) redirect('/')
  return <>{children}</>
}
