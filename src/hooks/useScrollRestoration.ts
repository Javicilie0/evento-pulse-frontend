'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'scroll-pos'

function getKey(pathname: string) {
  return `${STORAGE_KEY}:${pathname}`
}

export function useScrollSave() {
  const pathname = usePathname()

  useEffect(() => {
    const key = getKey(pathname)

    // Restore scroll on mount
    try {
      const saved = sessionStorage.getItem(key)
      if (saved != null) {
        const y = Number(saved)
        // Small delay to let content render
        requestAnimationFrame(() => {
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }))
        })
      }
    } catch {}

    // Save scroll on unmount
    const saveScroll = () => {
      try {
        sessionStorage.setItem(key, String(window.scrollY))
      } catch {}
    }

    window.addEventListener('beforeunload', saveScroll)
    return () => {
      saveScroll()
      window.removeEventListener('beforeunload', saveScroll)
    }
  }, [pathname])
}
