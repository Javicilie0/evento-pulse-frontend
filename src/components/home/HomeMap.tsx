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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(markers) }}
      />
      {hasMarkers ? (
        <div id="events-map" className="evt-map" style={{ width: '100%', height: '100%', minHeight: 340 }} />
      ) : (
        <div id="events-map" className="evt-map evt-map--empty" style={{ width: '100%', height: '100%', minHeight: 340 }}>
          <div className="evt-map__empty-state">
            <i className="bi bi-geo-alt" />
            <span data-i18n="home.map.empty">Няма събития с координати</span>
          </div>
        </div>
      )}
    </div>
  )
}
