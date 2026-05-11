'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const GENRES = [
  ['LiveMusic', 'Live музика'],
  ['Festival', 'Фестивал'],
  ['Theater', 'Театър'],
  ['Exhibition', 'Изложба'],
  ['Sport', 'Спорт'],
  ['Party', 'Парти'],
  ['Conference', 'Конференция'],
  ['Workshop', 'Уъркшоп'],
  ['Comedy', 'Комедия'],
  ['Cinema', 'Кино'],
  ['FreeEvent', 'Безплатно'],
  ['ForKids', 'За деца'],
  ['Techno', 'Техно'],
  ['House', 'Хаус'],
  ['Jazz', 'Джаз'],
  ['Other', 'Друго'],
] as const

interface Preferences {
  preferredGenres: string[]
  preferredCity?: string
  minAge?: number
  maxDistanceKm?: number
}

export default function PreferencesPage() {
  const [genres, setGenres] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [minAge, setMinAge] = useState('')
  const [distance, setDistance] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get<Preferences>('/api/preferences')
      .then(r => {
        setGenres(r.data.preferredGenres ?? [])
        setCity(r.data.preferredCity ?? '')
        setMinAge(r.data.minAge ? String(r.data.minAge) : '')
        setDistance(r.data.maxDistanceKm ? String(r.data.maxDistanceKm) : '')
      })
      .finally(() => setLoading(false))
  }, [])

  function toggleGenre(value: string) {
    setGenres(prev => prev.includes(value) ? prev.filter(g => g !== value) : [...prev, value])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await api.put('/api/preferences', {
        preferredGenres: genres,
        preferredCity: city || undefined,
        minAge: minAge ? Number(minAge) : undefined,
        maxDistanceKm: distance ? Number(distance) : undefined,
      })
      setMessage('Предпочитанията са запазени.')
    } catch {
      setMessage('Предпочитанията не могат да бъдат запазени.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp">Профил</span>
          <h1>Моите <span>предпочитания</span>.</h1>
          <p className="groove-page-hero__lead">Използват се за препоръки и по-точно откриване на събития.</p>
        </div>
      </div>

      <div className="groove-paper-card mt-4">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-zine-form">
            {message && <div className="groove-alert groove-alert-warning mb-3">{message}</div>}
            <div className="auth-zine-field">
              <label>Любими жанрове</label>
              <div className="d-flex gap-2 flex-wrap">
                {GENRES.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`groove-button ${genres.includes(value) ? 'groove-button-dark' : 'groove-button-paper'} groove-button--sm`}
                    onClick={() => toggleGenre(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="row g-3 mt-1">
              <div className="col-md-4">
                <div className="auth-zine-field">
                  <label htmlFor="city">Град</label>
                  <input id="city" className="form-control" value={city} onChange={e => setCity(e.target.value)} maxLength={80} />
                </div>
              </div>
              <div className="col-md-4">
                <div className="auth-zine-field">
                  <label htmlFor="minAge">Минимална възраст</label>
                  <input id="minAge" type="number" min="0" max="120" className="form-control" value={minAge} onChange={e => setMinAge(e.target.value)} />
                </div>
              </div>
              <div className="col-md-4">
                <div className="auth-zine-field">
                  <label htmlFor="distance">Макс. разстояние (км)</label>
                  <input id="distance" type="number" min="0" max="10000" className="form-control" value={distance} onChange={e => setDistance(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="groove-form-actions mt-4">
              <button className="auth-zine-button auth-zine-button-red" type="submit" disabled={saving}>
                <i className="bi bi-check2" /> {saving ? 'Запазване...' : 'Запази'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
