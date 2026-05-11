'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export function MediaUploadField({ value, onChange, folder = 'general', label = 'Снимка' }: { value: string; onChange: (url: string) => void; folder?: string; label?: string }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function upload(file: File | null) {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', folder)
      const res = await api.post('/api/media/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange(res.data.url)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Файлът не може да бъде качен.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="auth-zine-field">
      <label>{label}</label>
      <div className="input-group">
        <input className="form-control" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="https:// или /uploads/..." />
        <label className="btn btn-outline-secondary mb-0">
          {uploading ? 'Качване...' : 'Качи'}
          <input type="file" accept="image/*,video/*" hidden onChange={e => upload(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      {error && <div className="small text-danger mt-1">{error}</div>}
    </div>
  )
}
