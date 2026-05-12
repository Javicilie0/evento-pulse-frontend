import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns'
import { bg } from 'date-fns/locale'
import type { EventCard as EventCardType, PaginatedResult } from '@/types/api'

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>
}

const bgWeekdays = ['Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб', 'Нед']
const bgWeekdayLong = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя']

function resolveMonth(sp: { month?: string; year?: string }) {
  if (sp.year && sp.month && /^\d{4}$/.test(sp.year) && /^\d{1,2}$/.test(sp.month)) {
    const year = Number(sp.year)
    const monthIndex = Number(sp.month) - 1
    if (monthIndex >= 0 && monthIndex <= 11) return new Date(year, monthIndex, 1)
  }

  if (sp.month && /^\d{4}-\d{2}$/.test(sp.month)) {
    const [year, month] = sp.month.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }

  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function dayKey(value: Date) {
  return format(value, 'yyyy-MM-dd')
}

export default async function CalendarPage({ searchParams }: Props) {
  const sp = await searchParams
  const month = resolveMonth(sp)

  const dateFrom = format(startOfMonth(month), 'yyyy-MM-dd')
  const dateTo = format(endOfMonth(month), 'yyyy-MM-dd')
  const prevMonth = format(addMonths(month, -1), 'yyyy-MM')
  const nextMonth = format(addMonths(month, 1), 'yyyy-MM')
  const monthName = format(month, 'MMMM yyyy', { locale: bg })
  const daysInMonth = endOfMonth(month).getDate()
  const startWeekday = (startOfMonth(month).getDay() + 6) % 7
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let events: EventCardType[] = []
  try {
    const res = await (await authenticatedServerApi()).get<PaginatedResult<EventCardType>>('/api/events', {
      params: { dateFrom, dateTo, pageSize: '96', sort: 'soon' }
    })
    events = res.data.items
  } catch {}

  const eventsByDay = new Map<number, EventCardType[]>()
  for (const event of events) {
    const eventDate = new Date(event.startTime)
    const day = eventDate.getDate()
    eventsByDay.set(day, [...(eventsByDay.get(day) ?? []), event])
  }

  return (
    <section className="evt-cal-shell">
      <div className="evt-cal-head">
        <div>
          <h1>Календар</h1>
          <p className="text-muted m-0">Виж всички събития за избрания месец.</p>
        </div>
        <div className="evt-cal-controls">
          <div className="evt-cal-month-switcher">
            <Link href={`/calendar?month=${prevMonth}`} className="evt-cal-nav" title="Предишен" aria-label="Предишен месец">
              <i className="bi bi-chevron-left" />
            </Link>
            <span className="evt-cal-month">{monthName}</span>
            <Link href={`/calendar?month=${nextMonth}`} className="evt-cal-nav" title="Следващ" aria-label="Следващ месец">
              <i className="bi bi-chevron-right" />
            </Link>
          </div>
          <Link href="/" className="evt-btn evt-btn-ghost evt-cal-map-link">
            <i className="bi bi-map" /> Карта
          </Link>
        </div>
      </div>

      <div className="evt-cal-grid">
        <div className="evt-cal-weekdays" aria-hidden="true">
          {bgWeekdays.map(day => <span key={day}>{day}</span>)}
        </div>

        <div className="evt-cal-days">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`spacer-${i}`} className="evt-cal-day evt-cal-day--spacer is-other" aria-hidden="true" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayDate = new Date(month.getFullYear(), month.getMonth(), day)
            const dayEvents = eventsByDay.get(day) ?? []
            const isToday = dayKey(dayDate) === dayKey(today)
            const weekdayName = bgWeekdayLong[(dayDate.getDay() + 6) % 7]

            return (
              <div
                key={day}
                className={`evt-cal-day ${isToday ? 'is-today' : ''} ${dayEvents.length > 0 ? 'has-events' : 'is-empty'}`}
                aria-label={`${day} ${monthName}, ${weekdayName}`}
              >
                <span className="evt-cal-day__num">
                  <span>{day}</span>
                  <small>{weekdayName}</small>
                </span>
                <div className="evt-cal-day__events">
                  {dayEvents.slice(0, 3).map(event => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="evt-cal-event"
                      title={`${event.title} · ${event.city} · ${format(new Date(event.startTime), 'HH:mm')}`}
                    >
                      <time dateTime={event.startTime}>{format(new Date(event.startTime), 'HH:mm')}</time>
                      <span>{event.title}</span>
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <Link
                      href={`/?dateFrom=${dayKey(dayDate)}&dateTo=${dayKey(dayDate)}`}
                      className="evt-cal-event evt-cal-event--more"
                    >
                      + {dayEvents.length - 3} още
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {events.length === 0 && (
          <div className="evt-cal-empty">
            <i className="bi bi-calendar3" />
            <strong>Няма събития за {monthName}.</strong>
            <span>Пробвай друг месец или се върни към картата.</span>
          </div>
        )}
      </div>

      {events.length > 0 && (
        <div className="evt-cal-mobile-help">
          <i className="bi bi-phone" />
          <span>На телефон календарът се показва като дневен списък, за да се чете удобно.</span>
        </div>
      )}
    </section>
  )
}
