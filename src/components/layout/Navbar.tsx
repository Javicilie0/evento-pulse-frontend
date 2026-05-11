'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isAdmin = session?.user?.roles?.includes('Admin')
  const isOrganizer = session?.user?.roles?.includes('Organizer') || isAdmin
  const isValidator = session?.user?.roles?.includes('Validator')

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
    const first = session.user.firstName
    const last = session.user.lastName
    const full = [first, last].filter(Boolean).join(' ')
    return full || session.user.name || session.user.email || 'Профил'
  })()

  return (
    <header className="site-header">
      <nav className="navbar navbar-expand-md navbar-dark border-bottom shadow-sm site-navbar">
        <div className="container-fluid">
          {/* Brand */}
          <Link className="navbar-brand fw-bold d-inline-flex align-items-center gap-2 site-brand" href="/">
            <img src="/img/logo.svg" alt="Evento" className="site-brand__logo" />
            <span className="site-brand__name notranslate" translate="no">Evento</span>
          </Link>

          {/* Theme + Lang toggles */}
          <button
            id="app-theme-btn"
            type="button"
            onClick={() => (window as any).toggleAppTheme?.()}
            title="Светла / Тъмна тема"
            style={{
              background: 'transparent',
              border: '1px solid #e5e7ef',
              borderRadius: '999px',
              fontSize: '14px',
              padding: '5px 10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: '#0d1424',
            }}
          >
            <i className="bi bi-moon-stars" />
          </button>

          <button
            id="app-lang-btn"
            type="button"
            onClick={() => (window as any).toggleAppLang?.()}
            style={{
              background: '#0d1424',
              color: '#fff',
              border: 'none',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '13px',
              padding: '5px 12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            🇬🇧 EN
          </button>

          {/* Burger */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Навигация"
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* Nav links */}
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-md-0 site-navbar__primary">
              <li className="nav-item">
                <Link className="nav-link" href="/">
                  <i className="bi bi-search" /> <span data-i18n="nav.discover">Открий</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="/flow">
                  <i className="bi bi-compass" /> <span data-i18n="nav.feed">Поток</span>
                </Link>
              </li>
              {session && (
                <li className="nav-item">
                  <Link className="nav-link nav-link--with-badge" href="/inbox">
                    <i className="bi bi-chat-dots" /> <span data-i18n="nav.messages">Съобщения</span>
                  </Link>
                </li>
              )}
              {isAdmin && (
                <li className="nav-item">
                  <Link className="nav-link" href="/admin">
                    <i className="bi bi-shield-check" /> <span data-i18n="nav.admin.panel">Админ панел</span>
                  </Link>
                </li>
              )}
              {!isAdmin && isOrganizer && (
                <li className="nav-item">
                  <Link className="nav-link" href="/organizer/dashboard">
                    <i className="bi bi-speedometer2" /> <span data-i18n="nav.organizer.panel">Organizer Panel</span>
                  </Link>
                </li>
              )}
              {!isAdmin && !isOrganizer && isValidator && (
                <li className="nav-item">
                  <Link className="nav-link" href="/tickets/scan">
                    <i className="bi bi-qr-code-scan" /> <span data-i18n="nav.validate">Validate tickets</span>
                  </Link>
                </li>
              )}
            </ul>

            {/* Auth area */}
            <ul className="navbar-nav">
              {session ? (
                <li className="nav-item dropdown site-account-menu">
                  <a
                    className="nav-link dropdown-toggle p-1 d-flex align-items-center gap-2"
                    href="#"
                    id="accountMenu"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    title={displayName}
                  >
                    <span className="evt-avatar-circle notranslate" translate="no">{initials}</span>
                    <span className="d-none d-md-inline text-truncate" style={{ maxWidth: 130, fontSize: '.875rem', fontWeight: 600 }}>
                      {displayName}
                    </span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountMenu">
                    <li>
                      <Link className="dropdown-item" href="/account">
                        <i className="bi bi-person-circle" /> <span data-i18n="account.overview">Профил</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href={`/profile/${session.user.id}`}>
                        <i className="bi bi-person-lines-fill" /> <span data-i18n="profile.public">Public profile</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/flow/new">
                        <i className="bi bi-plus-square" /> <span data-i18n="post.create">Create post</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/events/recommended">
                        <i className="bi bi-stars" /> <span data-i18n="nav.recommended">Recommended</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/wrapped">
                        <i className="bi bi-bar-chart-line" /> <span data-i18n="nav.wrapped">Year Wrapped</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/tickets">
                        <i className="bi bi-ticket-perforated" /> <span data-i18n="nav.mytickets">My tickets</span>
                      </Link>
                    </li>
                    {(isOrganizer || isAdmin || isValidator) && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        {(isOrganizer || isAdmin) && (
                          <>
                            <li>
                              <Link className="dropdown-item" href="/organizer/dashboard">
                                <i className="bi bi-speedometer2" /> <span data-i18n="organizer.dashboard">Organizer dashboard</span>
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/organizer/pages">
                                <i className="bi bi-person-badge" /> <span data-i18n="organizer.public.pages">Public organizer pages</span>
                              </Link>
                            </li>
                          </>
                        )}
                        <li>
                          <Link className="dropdown-item" href="/tickets/scan">
                            <i className="bi bi-qr-code-scan" /> <span data-i18n="nav.validate">Validate tickets</span>
                          </Link>
                        </li>
                      </>
                    )}
                    {isAdmin && (
                      <li>
                        <Link className="dropdown-item" href="/admin">
                          <i className="bi bi-shield-check" /> <span data-i18n="nav.admin.panel">Админ панел</span>
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => signOut({ callbackUrl: '/' })}
                      >
                        <i className="bi bi-box-arrow-right" /> <span data-i18n="auth.logout">Logout</span>
                      </button>
                    </li>
                  </ul>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link site-register-link" href="/register">
                      <i className="bi bi-person-plus" /> <span data-i18n="auth.register">Регистрация</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" href="/login">
                      <i className="bi bi-box-arrow-in-right" /> <span data-i18n="auth.login">Вход</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}
