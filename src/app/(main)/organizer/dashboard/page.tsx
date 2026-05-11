import { Suspense } from 'react'
import OrganizerDashboardClient from './OrganizerDashboardClient'

export const dynamic = 'force-dynamic'

function DashboardSkeleton() {
  return (
    <section className="groove-app-page">
      <div className="groove-page-hero" style={{ opacity: 0.5 }}>
        <div className="groove-page-hero__copy">
          <div style={{ height: 16, width: 80, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 32, width: 240, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 16, width: 320, background: '#e5e7eb', borderRadius: 4 }} />
        </div>
      </div>
      <div className="row g-3 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="col-6 col-md-4 col-lg-2">
            <div className="groove-paper-card text-center py-3" style={{ opacity: 0.4 }}>
              <div style={{ height: 24, width: 24, background: '#e5e7eb', borderRadius: '50%', margin: '0 auto 8px' }} />
              <div style={{ height: 20, width: 48, background: '#e5e7eb', borderRadius: 4, margin: '0 auto 4px' }} />
              <div style={{ height: 12, width: 64, background: '#e5e7eb', borderRadius: 4, margin: '0 auto' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function OrganizerDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <OrganizerDashboardClient />
    </Suspense>
  )
}
