import { serverApi } from '@/lib/api'
import Link from 'next/link'
import type { AuthUser } from '@/types/api'

async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await serverApi().get<AuthUser>('/api/auth/me')
    return res.data
  } catch {
    return null
  }
}

export default async function AccountPage() {
  const user = await getMe()

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal" data-i18n="account.stamp">Акаунт</span>
          <h1 data-i18n-html="account.title">Твоят <span>профил</span>.</h1>
          <p data-i18n="account.desc">Настройки, данни и история на акаунта.</p>
        </div>
      </div>

      {user && (
        <div className="groove-split mt-4">
          <article className="groove-paper-card">
            <span className="groove-kicker" data-i18n="account.personal">Лична информация</span>
            <dl className="groove-data-list mt-3">
              <dt>Имейл</dt>
              <dd>{user.email}</dd>
              <dt>Потребителско ime</dt>
              <dd>{user.userName}</dd>
              {user.firstName && <><dt>Ime</dt><dd>{user.firstName}</dd></>}
              {user.lastName && <><dt>Фамилия</dt><dd>{user.lastName}</dd></>}
              <dt>Роли</dt>
              <dd>{user.roles.join(', ') || 'Потребител'}</dd>
            </dl>
          </article>

          <aside className="groove-info-card">
            <div className="groove-form-actions flex-column">
              <Link href={`/profile/${user.id}`} className="groove-button groove-button-paper">
                <i className="bi bi-person-lines-fill" /> <span>Публичен профил</span>
              </Link>
              <Link href="/tickets" className="groove-button groove-button-paper">
                <i className="bi bi-ticket-perforated" /> <span>Моите билети</span>
              </Link>
              <Link href="/events/recommended" className="groove-button groove-button-paper">
                <i className="bi bi-stars" /> <span>Препоръчани</span>
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
