import { serverApi } from '@/lib/api'
import { EventCard } from '@/components/events/EventCard'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns'
import type { EventCard as EventCardType, PaginatedResult } from '@/types/api'

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const sp = await searchParams
  const now = new Date()
  const month = sp.month ? new Date(sp.month + '-01') : now

  const dateFrom = format(startOfMonth(month), 'yyyy-MM-dd')
  const dateTo = format(endOfMonth(month), 'yyyy-MM-dd')
  const prevMonth = format(addMonths(month, -1), 'yyyy-MM')
  const nextMonth = format(addMonths(month, 1), 'yyyy-MM')

  let events: EventCardType[] = []
  try {
    const res = await serverApi().get<PaginatedResult<EventCardType>>('/api/events', {
      params: { dateFrom, dateTo, pageSize: '48', sort: 'soon' }
    })
    events = res.data.items
  } catch {}

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal" data-i18n="calendar.stamp">Календар</span>
          <h1 data-i18n-html="calendar.title">Събития за <span>{format(month, 'MMMM yyyy')}</span>.</h1>
        </div>
        <div className="groove-page-actions">
          <Link href={`/calendar?month=${prevMonth}`} className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" />
          </Link>
          <Link href={`/calendar?month=${nextMonth}`} className="groove-button groove-button-paper">
            <i className="bi bi-arrow-right" />
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="groove-empty-card mt-4">
          <i className="bi bi-calendar3" />
          <h2 className="groove-panel-title">Няма събития за {format(month, 'MMMM yyyy')}.</h2>
        </div>
      ) : (
        <div className="evt-grid mt-4">
          {events.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </section>
  )
}
