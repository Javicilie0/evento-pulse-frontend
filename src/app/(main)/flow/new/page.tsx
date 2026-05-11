'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { MediaUploadField } from '@/components/forms/MediaUploadField'

interface OrganizerProfile { id: number; displayName: string; isDefault: boolean; businessWorkspaceId?: number }
interface Workspace { id: number; displayName: string; isDefault: boolean }

export default function CreatePostPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [organizerProfileId, setOrganizerProfileId] = useState('')
  const [businessWorkspaceId, setBusinessWorkspaceId] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [profiles, setProfiles] = useState<OrganizerProfile[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<OrganizerProfile[]>('/api/organizer/profiles').then(r => {
      setProfiles(r.data)
      const def = r.data.find(p => p.isDefault) ?? r.data[0]
      if (def) {
        setOrganizerProfileId(String(def.id))
        if (def.businessWorkspaceId) setBusinessWorkspaceId(String(def.businessWorkspaceId))
      }
    }).catch(() => {})

    api.get<Workspace[]>('/api/organizer/workspaces').then(r => {
      setWorkspaces(r.data)
      const def = r.data.find(w => w.isDefault)
      if (def) setBusinessWorkspaceId(current => current || String(def.id))
    }).catch(() => {})
  }, [])

  function handleProfileChange(value: string) {
    setOrganizerProfileId(value)
    const profile = profiles.find(p => String(p.id) === value)
    if (profile?.businessWorkspaceId) setBusinessWorkspaceId(String(profile.businessWorkspaceId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    if (!organizerProfileId) {
      setError('Choose a public page before publishing.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/api/posts', {
        content,
        organizerProfileId: Number(organizerProfileId),
        businessWorkspaceId: businessWorkspaceId ? Number(businessWorkspaceId) : undefined,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? 'Image' : undefined,
      })
      router.push('/flow')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error while publishing.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker" data-i18n="post.create.kicker">New post</span>
          <h1 className="groove-panel-title" data-i18n="post.create.title">Share something.</h1>
        </div>
        <Link href="/flow" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> <span data-i18n="common.back">Back</span>
        </Link>
      </div>

      <div className="groove-paper-card">
        <form onSubmit={handleSubmit} className="auth-zine-form">
          {error && (
            <div className="auth-zine-validation" role="alert">
              <ul><li>{error}</li></ul>
            </div>
          )}

          <div className="auth-zine-field">
            <label htmlFor="content" data-i18n="post.content.label">Text</label>
            <textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              placeholder="Share news, an event, or a thought..."
              data-i18n-placeholder="post.content.placeholder"
              maxLength={2000}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          {profiles.length > 0 ? (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="auth-zine-field">
                  <label htmlFor="profile">Public page *</label>
                  <select id="profile" className="form-select" value={organizerProfileId} onChange={e => handleProfileChange(e.target.value)} required>
                    <option value="">Choose public page</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.displayName}{p.isDefault ? ' (default)' : ''}</option>)}
                  </select>
                </div>
              </div>
              {workspaces.length > 0 && (
                <div className="col-md-6">
                  <div className="auth-zine-field">
                    <label htmlFor="workspace">Workspace</label>
                    <select id="workspace" className="form-select" value={businessWorkspaceId} onChange={e => setBusinessWorkspaceId(e.target.value)}>
                      <option value="">No workspace</option>
                      {workspaces.map(w => <option key={w.id} value={w.id}>{w.displayName}{w.isDefault ? ' (default)' : ''}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="groove-empty-card">
              <h2 className="groove-panel-title">Create a public page first.</h2>
              <Link href="/organizer/profiles/edit/new" className="groove-button groove-button-dark">
                <i className="bi bi-person-badge" /> Public page
              </Link>
            </div>
          )}

          <MediaUploadField label="Media" folder="posts" value={mediaUrl} onChange={setMediaUrl} />

          <button type="submit" className="auth-zine-button auth-zine-button-teal" disabled={loading || profiles.length === 0}>
            <i className="bi bi-send" />
            {' '}
            <span data-i18n="post.publish">{loading ? 'Publishing...' : 'Publish'}</span>
          </button>
        </form>
      </div>
    </section>
  )
}
