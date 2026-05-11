import { serverApi } from '@/lib/api'
import { EventCard } from '@/components/events/EventCard'
import Link from 'next/link'
import type { EventCard as EventCardType, PaginatedResult } from '@/types/api'

async function getRecommended(): Promise<EventCardType[]> {
  try {
    const res = await serverApi().get<PaginatedResult<EventCardType>>('/api/events', {
      params: { pageSize: '12', sort: 'popular' }
    })
    return res.data.items
  } catch {
    return []
  }
}

export default async function RecommendedPage() {
  const events = await getRecommended()

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal" data-i18n="recommended.stamp">Препоръчани</span>
          <h1 data-i18n-html="recommended.title">За <span>теб</span>.</h1>
          <p data-i18n="recommended.desc">Събитията, подредени специално за теб.</p>
        </div>
        <Link href="/" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> <span data-i18n="common.back">Назад</span>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="groove-empty-card mt-4">
          <i className="bi bi-stars" />
          <h2 className="groove-panel-title">Все още няма препоръки.</h2>
          <Link href="/" className="groove-button groove-button-dark mt-3">
            <i className="bi bi-search" /> Разгледай всички
          </Link>
        </div>
      ) : (
        <div className="evt-grid mt-4">
          {events.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </section>
  )
}
