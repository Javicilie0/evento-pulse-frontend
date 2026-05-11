'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { mediaUrl } from '@/lib/media'
import type { EventCard } from '@/types/api'

interface EventsResponse {
  items: EventCard[]
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [events, setEvents] = useState<EventCard[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const smart = await api.post('/api/search/smart', { query })
      const params = new URLSearchParams()
      const city = smart.data.city || smart.data.cities?.[0]
      const genre = smart.data.genre || smart.data.genres?.[0]
      const keyword = smart.data.keyword || query
      if (city) params.set('city', city)
      if (genre) params.set('genre', genre)
      if (keyword) params.set('keyword', keyword)
      const res = await api.get<EventsResponse>(`/api/events?${params.toString()}`)
      setEvents(res.data.items ?? [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp">AI</span>
          <h1>Търсене <span>на събития</span>.</h1>
          <p className="groove-page-hero__lead">Напиши каква вечер търсиш и Evento ще превърне текста във филтри.</p>
        </div>
      </div>

      <form className="groove-search-panel mt-4" onSubmit={handleSearch}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="техно тази вечер в София" maxLength={180} />
        <button className="groove-button groove-button-dark" type="submit" disabled={loading}>
          <i className="bi bi-stars" /> {loading ? 'Търсене...' : 'Търси'}
        </button>
      </form>

      <div className="row g-3 mt-3">
        {events.map(event => (
          <div key={event.id} className="col-md-6 col-xl-4">
            <Link href={`/events/${event.id}`} className="evt-event-card d-block text-decoration-none">
              {event.imageUrl ? (
                <img src={mediaUrl(event.imageUrl)} alt={event.title} className="evt-event-card__image" />
              ) : (
                <span className="evt-event-card__image evt-event-card__image--placeholder"><i className="bi bi-calendar-event" /></span>
              )}
              <div className="evt-event-card__body">
                <span className="groove-kicker">{event.genre}</span>
                <h2>{event.title}</h2>
                <p>{event.city}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
