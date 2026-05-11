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
      const res = await api.post('/api/ai/search', { query: q })
      const params = res.data as Record<string, string>
      const qs = new URLSearchParams(params).toString()
      router.push(qs ? `/?${qs}` : '/')
    } catch {
      router.push(`/?search=${encodeURIComponent(q)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="evt-ai-search-wrap">
      <form
        ref={formRef}
        id="home-smart-search-form"
        className="evt-ai-search-form"
        onSubmit={handleSmartSearch}
      >
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
      </form>
    </div>
  )
}
