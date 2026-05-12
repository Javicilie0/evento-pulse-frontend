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

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal" data-i18n="recommended.stamp">Препоръчани</span>
          <h1 data-i18n-html="recommended.title">За <span>теб</span>.</h1>
          <p>
            {isPersonalized
              ? 'Събитията са подредени според твоите харесвания и интереси.'
              : 'Популярни предстоящи събития. Харесай или запази, за да получиш персонализирани препоръки.'}
          </p>
        </div>
        <Link href="/" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> <span data-i18n="common.back">Назад</span>
        </Link>
      </div>

      {isPersonalized && (
        <div className="groove-alert mt-3 mb-0" style={{ background: 'var(--bs-info-bg-subtle)', borderColor: 'var(--bs-info)', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-stars" />
          Персонализирано за теб на база твоите харесвания и посещения
        </div>
      )}

      {items.length === 0 ? (
        <div className="groove-empty-card mt-4">
          <i className="bi bi-stars" />
          <h2 className="groove-panel-title">Все още няма препоръки.</h2>
          <p className="text-muted">Харесай или запази някои събития и ще видиш персонализиран feed.</p>
          <Link href="/" className="groove-button groove-button-dark mt-3">
            <i className="bi bi-search" /> Разгледай всички
          </Link>
        </div>
      ) : (
        <div className="evt-grid mt-4">
          {items.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </section>
  )
}
