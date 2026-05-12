import { authenticatedServerApi } from '@/lib/serverApi'
import { EventCard } from '@/components/events/EventCard'
import Link from 'next/link'
import type { EventCard as EventCardType } from '@/types/api'

interface RecommendedResponse {
  items: EventCardType[]
  isPersonalized: boolean
}

async function getRecommended(): Promise<RecommendedResponse> {
  try {
    const res = await (await authenticatedServerApi()).get<RecommendedResponse>('/api/events/recommended', {
      params: { pageSize: '12' }
    })
    return res.data
  } catch {
    return { items: [], isPersonalized: false }
  }
}

export default async function RecommendedPage() {
  const { items, isPersonalized } = await getRecommended()
  const recommendationsLabel = items.length === 1 ? 'събитие' : 'събития'

  return (
    <section className="evt-page-shell">
      <header className="evt-page-hero">
        <span className="evt-page-hero__kicker">
          <i className="bi bi-stars" /> <span data-i18n="rec.stamp">Подбор</span>
        </span>
        <h1 data-i18n-html="rec.h1">Вечери, избрани <span>за теб</span>.</h1>
        <p data-i18n="rec.p">
          Тук събираме предстоящите събития, които най-добре пасват на твоите предпочитания.
          Ако още не си ги настроил, ще покажем всички одобрени предложения.
        </p>
        <div className="evt-page-hero__cta">
          <Link href="/preferences" className="evt-btn evt-btn-ghost">
            <i className="bi bi-sliders" /> <span data-i18n="rec.myprefs">Моите предпочитания</span>
          </Link>
          <Link href="/preferences" className="evt-btn evt-btn-primary">
            <i className="bi bi-pencil" /> <span data-i18n="rec.settings">Настрой препоръките</span>
          </Link>
        </div>
      </header>

      {!isPersonalized && (
        <div className="evt-page-banner">
          <i className="bi bi-info-circle" />
          <div>
            <strong data-i18n="rec.no.prefs">Нямаш запазени предпочитания.</strong>
            <span data-i18n="rec.no.prefs.desc">
              Показваме всички предстоящи одобрени събития. Добави любим жанр, град или радиус,
              за да получаваш по-точни предложения.
            </span>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="evt-page-empty">
          <i className="bi bi-stars" />
          <h2 data-i18n-html="rec.empty.title">Още няма <span>точно попадение</span>.</h2>
          <p data-i18n="rec.empty.desc">
            Няма предстоящи събития, които да отговарят на сегашните ти настройки.
            Можеш да ги промениш или да разгледаш всички събития.
          </p>
          <div className="evt-page-hero__cta">
            <Link href="/preferences" className="evt-btn evt-btn-primary">
              <i className="bi bi-sliders" /> <span data-i18n="rec.change.prefs">Промени предпочитанията</span>
            </Link>
            <Link href="/" className="evt-btn evt-btn-ghost">
              <i className="bi bi-compass" /> <span data-i18n="nav.home">Към началото</span>
            </Link>
          </div>
        </div>
      ) : (
        <section className="evt-page-section">
          <header className="evt-page-section__head">
            <span className="evt-page-section__kicker" data-i18n="rec.upcoming.kicker">Предстоящи предложения</span>
            <h2>{items.length} <span>{recommendationsLabel}</span> за следващите дни.</h2>
          </header>

          <div className="evt-page-grid">
            {items.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}
    </section>
  )
}
