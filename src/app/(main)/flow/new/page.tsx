'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { MediaUploadField } from '@/components/forms/MediaUploadField'

interface OrganizerProfile {
  id: number
  displayName: string
  isDefault: boolean
  businessWorkspaceId?: number
}

interface Workspace {
  id: number
  displayName: string
  isDefault: boolean
}

interface OrganizerEvent {
  id: number
  title: string
  city?: string
  startTime?: string
  organizerPageName?: string
  isApproved?: boolean
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; message?: string } | string } }).response
    if (typeof response?.data === 'string') return response.data
    return response?.data?.error ?? response?.data?.message ?? 'Възникна грешка при публикуване.'
  }
  return 'Възникна грешка при публикуване.'
}

function inferMediaType(url: string) {
  const path = url.split(/[?#]/)[0].toLowerCase()
  return /\.(mp4|webm|mov|m4v)$/.test(path) ? 'Video' : 'Image'
}

function formatEventLabel(event: OrganizerEvent) {
  const date = event.startTime ? new Date(event.startTime) : null
  const formattedDate = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''
  return [event.title, event.city, formattedDate].filter(Boolean).join(' · ')
}

export default function CreatePostPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [eventId, setEventId] = useState('')
  const [organizerProfileId, setOrganizerProfileId] = useState('')
  const [businessWorkspaceId, setBusinessWorkspaceId] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    Promise.allSettled([
      api.get<OrganizerProfile[]>('/api/organizer/profiles'),
      api.get<Workspace[]>('/api/organizer/workspaces'),
      api.get<OrganizerEvent[]>('/api/organizer/events'),
    ]).then(([profilesResult, workspacesResult, eventsResult]) => {
      if (!mounted) return

      if (profilesResult.status === 'fulfilled') {
        const nextProfiles = profilesResult.value.data
        setProfiles(nextProfiles)
        const def = nextProfiles.find(p => p.isDefault) ?? nextProfiles[0]
        if (def) {
          setOrganizerProfileId(String(def.id))
          if (def.businessWorkspaceId) setBusinessWorkspaceId(String(def.businessWorkspaceId))
        }
      }

      if (workspacesResult.status === 'fulfilled') {
        const nextWorkspaces = workspacesResult.value.data
        setWorkspaces(nextWorkspaces)
        const def = nextWorkspaces.find(w => w.isDefault)
        if (def) setBusinessWorkspaceId(current => current || String(def.id))
      }

      if (eventsResult.status === 'fulfilled') {
        setEvents(eventsResult.value.data)
      }
    }).finally(() => {
      if (mounted) setBooting(false)
    })

    return () => {
      mounted = false
    }
  }, [])

  const activeProfile = useMemo(
    () => profiles.find(p => String(p.id) === organizerProfileId),
    [profiles, organizerProfileId],
  )
  const activeWorkspace = useMemo(
    () => workspaces.find(w => String(w.id) === businessWorkspaceId),
    [workspaces, businessWorkspaceId],
  )
  const canPublish = profiles.length > 0 && !!organizerProfileId && content.trim().length > 0

  function handleProfileChange(value: string) {
    setOrganizerProfileId(value)
    const profile = profiles.find(p => String(p.id) === value)
    if (profile?.businessWorkspaceId) setBusinessWorkspaceId(String(profile.businessWorkspaceId))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) {
      setError('Напиши текст за публикацията.')
      return
    }
    if (!organizerProfileId) {
      setError('Избери public page преди публикуване.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/api/posts', {
        content: content.trim(),
        eventId: eventId ? Number(eventId) : undefined,
        organizerProfileId: Number(organizerProfileId),
        businessWorkspaceId: businessWorkspaceId ? Number(businessWorkspaceId) : undefined,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? inferMediaType(mediaUrl) : undefined,
      })
      router.push('/flow')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page groove-form-shell">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Поток</span>
          <h1>Нова <span>публикация</span>.</h1>
          <p>Сподели новина, настроение или ъпдейт около събитие с добавена снимка или видео.</p>
        </div>
        <div className="groove-page-actions">
          <Link href="/flow" className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Към потока
          </Link>
        </div>
      </div>

      <div className="groove-form-panel">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {booting ? (
            <div className="groove-note mb-3">
              <strong>Publishing context</strong>
              <span>Зареждане на public pages, workspaces и събития...</span>
            </div>
          ) : profiles.length > 0 ? (
            <div className="groove-note mb-3">
              <strong data-i18n="workspace.publish.context">Publishing context</strong>
              <span>
                <span data-i18n="workspace.publish.as">Publishing as</span>: {activeProfile?.displayName ?? 'Избери public page'}
                {' · '}
                <span data-i18n="workspace.feed.visible">Visible in Discover</span>
                {activeWorkspace && (
                  <>
                    {' · '}
                    <span data-i18n="workspace.payments.to">Payments go to</span>: {activeWorkspace.displayName}
                  </>
                )}
              </span>
            </div>
          ) : (
            <div className="groove-empty-card mb-3">
              <i className="bi bi-person-badge" />
              <h2 className="groove-panel-title">Create a public page first.</h2>
              <p className="groove-panel-intro">Публикациите се публикуват през одобрена публична страница.</p>
              <Link href="/organizer/profiles/edit/new" className="groove-button groove-button-dark">
                <i className="bi bi-person-badge" /> Public page
              </Link>
            </div>
          )}

          {profiles.length > 0 && (
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="profile" className="form-label">Public page *</label>
                <select
                  id="profile"
                  className="form-select"
                  value={organizerProfileId}
                  onChange={e => handleProfileChange(e.target.value)}
                  required
                >
                  <option value="">Избери public page</option>
                  {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.displayName}{profile.isDefault ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {workspaces.length > 0 && (
                <div className="col-md-6">
                  <label htmlFor="workspace" className="form-label">Workspace</label>
                  <select
                    id="workspace"
                    className="form-select"
                    value={businessWorkspaceId}
                    onChange={e => setBusinessWorkspaceId(e.target.value)}
                  >
                    <option value="">Без workspace</option>
                    {workspaces.map(workspace => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.displayName}{workspace.isDefault ? ' (default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="content" className="form-label">Text</label>
            <textarea
              id="content"
              className="form-control"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              placeholder="Напиши нещо... (@username за тагване)"
              data-mentions
              maxLength={2000}
              required
            />
            <div className="d-flex justify-content-between gap-3 mt-1">
              <span className="form-text">Можеш да тагваш профили с @username.</span>
              <span className="form-text">{content.length}/2000</span>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="eventId" className="form-label">Event (optional)</label>
            <select
              id="eventId"
              className="form-select"
              value={eventId}
              onChange={e => setEventId(e.target.value)}
            >
              <option value="">Без свързано събитие</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{formatEventLabel(event)}</option>
              ))}
            </select>
            {events.length === 0 && (
              <div className="form-text">Нямаш налични organizer събития за свързване.</div>
            )}
          </div>

          <div className="mb-3">
            <MediaUploadField label="Photo or video" folder="posts" value={mediaUrl} onChange={setMediaUrl} />
            <div className="form-text">Снимка до 5 MB · Видео до 100 MB. Поддържани: jpg, png, gif, webp, mp4, webm, mov.</div>
          </div>

          <div className="groove-form-actions">
            <button type="submit" className="groove-button groove-button-dark" disabled={loading || !canPublish}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send" />}
              {loading ? 'Публикуване...' : 'Публикувай'}
            </button>
            <Link href="/flow" className="groove-button groove-button-paper">Отказ</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
