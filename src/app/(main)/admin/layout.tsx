import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Табло', icon: 'speedometer2' },
  { href: '/admin/users', label: 'Потребители', icon: 'people' },
  { href: '/admin/organizers', label: 'Организатори', icon: 'building' },
  { href: '/admin/events', label: 'Събития', icon: 'calendar-event' },
  { href: '/admin/posts', label: 'Публикации', icon: 'file-post' },
  { href: '/admin/tickets', label: 'Билети', icon: 'ticket-perforated' },
  { href: '/admin/transactions', label: 'Транзакции', icon: 'cash-stack' },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  const roles = session?.user?.roles
  if (!session || !roles?.includes('Admin')) redirect('/')
  return (
    <>
      <nav className="groove-paper-card mb-4 d-flex flex-wrap gap-2 align-items-center" aria-label="Админ навигация">
        {ADMIN_LINKS.map(link => (
          <a key={link.href} href={link.href} className="groove-button groove-button-paper groove-button--sm">
            <i className={`bi bi-${link.icon}`} /> {link.label}
          </a>
        ))}
      </nav>
      {children}
    </>
  )
}
