'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 72   // px to pull before triggering
const MAX_PULL   = 100 // px max visual pull distance

export function PullToRefresh() {
  const router = useRouter()
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const pullingRef = useRef(false)

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (startYRef.current === null || refreshing) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0 && window.scrollY === 0) {
        pullingRef.current = true
        // Resist: pull feels elastic
        const visual = Math.min(delta * 0.45, MAX_PULL)
        setPullY(visual)
        if (delta > 10) e.preventDefault()
      }
    }

    function onTouchEnd() {
      if (!pullingRef.current) return
      if (pullY >= THRESHOLD) {
        setRefreshing(true)
        setPullY(0)
        router.refresh()
        setTimeout(() => setRefreshing(false), 1200)
      } else {
        setPullY(0)
      }
      pullingRef.current = false
      startYRef.current = null
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [router, pullY, refreshing])

  if (pullY === 0 && !refreshing) return null

  const progress = Math.min(pullY / THRESHOLD, 1)
  const ready = pullY >= THRESHOLD

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: `translateX(-50%) translateY(${refreshing ? 12 : pullY - 20}px)`,
        zIndex: 9999,
        transition: refreshing ? 'transform 0.2s ease' : 'none',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: Math.max(0.3, progress),
          transform: `rotate(${progress * 180}deg)`,
          transition: refreshing ? 'transform 0.4s ease' : 'none',
        }}
      >
        {refreshing ? (
          <span className="spinner-border spinner-border-sm text-primary" style={{ width: 18, height: 18 }} />
        ) : (
          <i
            className="bi bi-arrow-down-circle"
            style={{
              fontSize: '1.1rem',
              color: ready ? '#4f46e5' : '#6b7280',
              transition: 'color 0.15s',
            }}
          />
        )}
      </div>
    </div>
  )
}
