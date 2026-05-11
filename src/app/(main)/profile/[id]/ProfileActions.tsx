'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export function ProfileActions({ profileId, initialIsFollowing, initialFollowerCount }: { profileId: string; initialIsFollowing: boolean; initialFollowerCount: number }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)

  async function toggleFollow() {
    setLoading(true)
    try {
      const res = isFollowing
        ? await api.delete(`/api/profiles/${profileId}/follow`)
        : await api.post(`/api/profiles/${profileId}/follow`)
      setIsFollowing(res.data.isFollowing)
      setFollowerCount(res.data.followerCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="groove-cta-row mt-3">
      <button className="groove-button groove-button-paper" type="button" onClick={toggleFollow} disabled={loading}>
        <i className={`bi ${isFollowing ? 'bi-person-check-fill' : 'bi-person-plus'}`} /> {isFollowing ? 'Следваш' : 'Следвай'} ({followerCount})
      </button>
      <Link href={`/inbox?userId=${profileId}`} className="groove-button groove-button-dark">
        <i className="bi bi-chat-dots" /> Съобщение
      </Link>
    </div>
  )
}
