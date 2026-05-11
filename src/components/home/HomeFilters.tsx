'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export function HomeFilters() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSmartSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setLoading(true)
    try {
      const res = await api.post('/api/search/smart', { query: q })
      const data = res.data as {
        city?: string
        cities?: string[]
        genre?: string
        genres?: string[]
        keyword?: string
        dateFrom?: string
        dateTo?: string
      }
      const params = new URLSearchParams()
      const city = data.city ?? data.cities?.[0]
      const genre = data.genre ?? data.genres?.[0]
      if (city) params.set('city', city)
      if (genre) params.set('genre', genre)
      if (data.keyword) params.set('search', data.keyword)
      if (data.dateFrom) params.set('dateFrom', data.dateFrom)
      if (data.dateTo) params.set('dateTo', data.dateTo)
      const qs = params.toString()
      router.push(qs ? `/?${qs}` : '/')
    } catch {
      router.push(`/?search=${encodeURIComponent(q)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="evt-ai-search-wrap">
      <div className="evt-ai-search__label">
        <i className="bi bi-stars" />
        <span data-i18n="search.ai.label">Търси с изкуствен интелект</span>
        <span className="evt-ai-search__badge">AI</span>
      </div>
      <form
        ref={formRef}
        id="home-smart-search-form"
        className="evt-ai-search-form"
        onSubmit={handleSmartSearch}
      >
        <div className="evt-ai-search-row">
          <input
            className="evt-ai-search-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="техно тази вечер в София..."
            data-i18n-placeholder="search.ai.placeholder"
            autoComplete="off"
          />
          <button
            className="evt-ai-search-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <i className="bi bi-stars" />
            )}
            <span data-i18n="search.ai.btn">{loading ? 'Търся...' : 'Търси с AI'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
