'use client'

import { useEffect, useRef } from 'react'

interface MapMarker {
  eventId: number
  title: string
  city: string
  address: string
  startTime: string
  genre: string
  imageUrl?: string
  organizerName?: string
  lat: number
  lng: number
  isApproximate: boolean
}

interface Props {
  markers: MapMarker[]
  hasMarkers: boolean
}

export function HomeMap({ markers, hasMarkers }: Props) {
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (scriptLoaded.current) return
    scriptLoaded.current = true

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
    const mapsKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

    window.EVENTO_API_URL = apiUrl

    const mapsState = window.GROOVEON_MAPS || { ready: false, callbacks: [] }
    window.GROOVEON_MAPS = mapsState
    window.initGoogleMap = function () {
      mapsState.ready = true
      mapsState.loaded = true
      ;(mapsState.callbacks || []).forEach((cb) => {
        try { cb() } catch (error) { console.error(error) }
      })
      mapsState.callbacks = []
    }

    if (mapsKey && !window.google?.maps && !mapsState.loading) {
      mapsState.loading = true
      const googleScript = document.createElement('script')
      googleScript.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsKey)}` +
        '&libraries=marker&region=BG&language=bg&callback=initGoogleMap'
      googleScript.async = true
      googleScript.defer = true
      googleScript.onerror = () => {
        mapsState.loading = false
      }
      document.head.appendChild(googleScript)
    }

    const script = document.createElement('script')
    script.src = '/js/home-map.js'
    script.defer = true
    document.body.appendChild(script)
  }, [])

  return (
    <div className="evt-hero__map">
      <script
        id="home-events-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ markers }) }}
      />
      <span className="evt-hero__map-badge">
        <i className="bi bi-broadcast" />
        <span data-i18n={hasMarkers ? 'home.map.live' : 'home.map.empty'}>
          {hasMarkers ? 'жива карта' : 'празна карта'}
        </span>
      </span>
      <span className="evt-hero__map-badge evt-hero__map-badge--right notranslate" translate="no">
        google maps
      </span>
      <div id="events-map" className="evt-map notranslate" translate="no" data-no-i18n="true" style={{ width: '100%', height: '100%', minHeight: 340 }}>
        <div className="map-loading-state">
          <i className="bi bi-map" style={{ fontSize: '1.6rem' }} />
          <span data-i18n="home.map.loading">
            {hasMarkers ? 'Картата се зарежда...' : 'Няма събития с координати'}
          </span>
        </div>
      </div>
      <div id="geo-status" className="evt-geo-status" />
      <button id="use-my-location" type="button" className="evt-hero__map-locate">
        <i className="bi bi-crosshair" />
        <span data-i18n="home.geo.btn">Около мен</span>
      </button>
    </div>
  )
}

declare global {
  interface Window {
    EVENTO_API_URL?: string
    google?: { maps?: unknown }
    initGoogleMap?: () => void
    GROOVEON_MAPS?: {
      ready?: boolean
      loaded?: boolean
      loading?: boolean
      callbacks?: Array<() => void>
    }
  }
}
