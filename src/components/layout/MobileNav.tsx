'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export function MobileNav() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isAdmin = session?.user?.roles?.includes('Admin')
  const isOrganizer = session?.user?.roles?.includes('Organizer') || isAdmin

  const initials = (() => {
    if (!session) return '?'
    const first = session.user.firstName
    const last = session.user.lastName
    if (first && last) return (first[0] + last[0]).toUpperCase()
    if (first) return first[0].toUpperCase()
    return (session.user.name?.[0] ?? '?').toUpperCase()
  })()

  const displayName = (() => {
    if (!session) return ''
    const full = [session.user.firstName, session.user.lastName].filter(Boolean).join(' ')
    return full || session.user.name || ''
  })()

  const isHome = pathname === '/'
  const isFeed = pathname.startsWith('/flow')
  const isMessages = pathname.startsWith('/inbox')
  const isPanel = pathname.startsWith('/admin') || pathname.startsWith('/organizer')

  return (
    <nav className="evt-bottom-nav d-flex d-md-none" aria-label="Мобилна навигация">
      <Link href="/" className={`evt-bottom-nav__item ${isHome ? 'active' : ''}`}>
        <i className="bi bi-search" />
        <span>Открий</span>
      </Link>

      <Link href="/flow" className={`evt-bottom-nav__item ${isFeed ? 'active' : ''}`}>
        <i className="bi bi-compass" />
        <span>Поток</span>
      </Link>

      {session && (
        <Link href="/inbox" className={`evt-bottom-nav__item evt-bottom-nav__item--with-badge ${isMessages ? 'active' : ''}`}>
          <i className="bi bi-chat-dots" />
          <span>Съобщения</span>
        </Link>
      )}

      {isAdmin && (
        <Link href="/admin" className={`evt-bottom-nav__item ${isPanel ? 'active' : ''}`}>
          <i className="bi bi-shield-check" />
          <span>Admin</span>
        </Link>
      )}

      {!isAdmin && isOrganizer && (
        <Link href="/organizer/dashboard" className={`evt-bottom-nav__item ${isPanel ? 'active' : ''}`}>
          <i className="bi bi-speedometer2" />
          <span>Панел</span>
        </Link>
      )}

      {session ? (
        <div className="evt-bottom-nav__item dropup">
          <button
            type="button"
            className="evt-bottom-nav__profile-btn dropdown-toggle"
            data-bs-toggle="dropdown"
            data-bs-offset="0,8"
            aria-expanded="false"
            title={displayName}
          >
            <span className="evt-avatar-circle evt-avatar-circle--sm">{initials}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow">
            <li className="px-3 py-2">
              <div className="d-flex align-items-center gap-2">
                <span className="evt-avatar-circle">{initials}</span>
                <div className="lh-sm">
                  <div className="fw-bold small">{displayName}</div>
                </div>
              </div>
            </li>
            <li><hr className="dropdown-divider my-1" /></li>
            <li>
              <Link className="dropdown-item" href="/account">
                <i className="bi bi-person-circle" /> Профил
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" href={`/profile/${session.user.id}`}>
                <i className="bi bi-person-lines-fill" /> Публичен профил
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" href="/events/recommended">
                <i className="bi bi-stars" /> Препоръчани
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" href="/tickets">
                <i className="bi bi-ticket-perforated" /> Моите билети
              </Link>
            </li>
            {(isOrganizer || isAdmin) && (
              <>
                <li><hr className="dropdown-divider my-1" /></li>
                <li>
                  <Link className="dropdown-item" href="/organizer/dashboard">
                    <i className="bi bi-speedometer2" /> Organizer dashboard
                  </Link>
                </li>
              </>
            )}
            {isAdmin && (
              <li>
                <Link className="dropdown-item" href="/admin">
                  <i className="bi bi-shield-check" /> Admin
                </Link>
              </li>
            )}
            <li><hr className="dropdown-divider my-1" /></li>
            <li>
              <button
                className="dropdown-item text-danger"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <i className="bi bi-box-arrow-right" /> Изход
              </button>
            </li>
          </ul>
        </div>
      ) : (
        <Link href="/login" className="evt-bottom-nav__item">
          <i className="bi bi-box-arrow-in-right" />
          <span>Вход</span>
        </Link>
      )}
    </nav>
  )
}
