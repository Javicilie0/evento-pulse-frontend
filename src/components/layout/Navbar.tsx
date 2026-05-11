'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function Navbar() {
  const { data: session } = useSession()

  const roles = session?.user?.roles ?? []
  const isAdmin = roles.includes('Admin')
  const isOrganizer = roles.includes('Organizer')
  const isValidator = roles.includes('Validator')

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
    return full || session.user.name || session.user.email || 'Профил'
  })()

  return (
    <header className="site-header">
      <nav className="navbar navbar-expand-md navbar-dark border-bottom shadow-sm site-navbar">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold d-inline-flex align-items-center gap-2 site-brand" href="/">
            <img src="/img/logo.svg" alt="Evento" className="site-brand__logo" />
            <span className="site-brand__name notranslate" translate="no">Evento</span>
          </Link>

          <button
            id="app-theme-btn"
            type="button"
            onClick={() => window.toggleAppTheme?.()}
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
            onClick={() => window.toggleAppLang?.()}
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
            EN
          </button>

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
              {isOrganizer && (
                <li className="nav-item">
                  <Link className="nav-link" href="/organizer/dashboard">
                    <i className="bi bi-speedometer2" /> <span data-i18n="nav.organizer.panel">Организатор</span>
                  </Link>
                </li>
              )}
              {isValidator && (
                <li className="nav-item">
                  <Link className="nav-link" href="/tickets/validate">
                    <i className="bi bi-qr-code-scan" /> <span data-i18n="nav.validate">Валидирай</span>
                  </Link>
                </li>
              )}
            </ul>

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
                        <i className="bi bi-person-lines-fill" /> <span data-i18n="profile.public">Публичен профил</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/flow/new">
                        <i className="bi bi-plus-square" /> <span data-i18n="post.create">Нова публикация</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/events/recommended">
                        <i className="bi bi-stars" /> <span data-i18n="nav.recommended">Препоръчани</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/tickets">
                        <i className="bi bi-ticket-perforated" /> <span data-i18n="nav.mytickets">Моите билети</span>
                      </Link>
                    </li>
                    {(isOrganizer || isValidator) && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        {isOrganizer && (
                          <li>
                            <Link className="dropdown-item" href="/organizer/dashboard">
                              <i className="bi bi-speedometer2" /> <span data-i18n="organizer.dashboard">Организаторско табло</span>
                            </Link>
                          </li>
                        )}
                        <li>
                          <Link className="dropdown-item" href="/tickets/validate">
                            <i className="bi bi-qr-code-scan" /> <span data-i18n="nav.validate">Валидиране</span>
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
                      <button className="dropdown-item" onClick={() => signOut({ callbackUrl: '/' })}>
                        <i className="bi bi-box-arrow-right" /> <span data-i18n="auth.logout">Изход</span>
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

declare global {
  interface Window {
    toggleAppTheme?: () => void
    toggleAppLang?: () => void
  }
}
