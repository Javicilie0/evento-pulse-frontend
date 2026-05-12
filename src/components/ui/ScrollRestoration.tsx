'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Saves and restores window scroll position per-route across client navigations.
// Data is stored in sessionStorage so it survives soft navigations but not hard reloads.

const KEY = (p: string) => `__scroll:${p}`

export function ScrollRestoration() {
  const pathname = usePathname()

  useEffect(() => {
    const key = KEY(pathname)

    // Restore saved position (two rAFs let React finish painting)
    try {
      const saved = sessionStorage.getItem(key)
      if (saved != null) {
        const y = Number(saved)
        requestAnimationFrame(() =>
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }))
        )
      }
    } catch {}

    // Save position on unload / soft navigation away
    const save = () => {
      try { sessionStorage.setItem(key, String(window.scrollY)) } catch {}
    }

    window.addEventListener('beforeunload', save)
    return () => {
      save()
      window.removeEventListener('beforeunload', save)
    }
  }, [pathname])

  return null
}
