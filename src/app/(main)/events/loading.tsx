export default function EventsLoading() {
  return (
    <section className="groove-app-page">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        .skel { background: linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 4px; }
      `}</style>

      {/* Header bar skeleton */}
      <div className="groove-section-bar mb-4">
        <div>
          <div className="skel" style={{ height: 12, width: 60, marginBottom: 8 }} />
          <div className="skel" style={{ height: 24, width: 160 }} />
        </div>
        <div className="skel" style={{ height: 36, width: 140, borderRadius: 8 }} />
      </div>

      {/* Filters skeleton */}
      <div className="groove-filters mb-4">
        <div className="groove-filters__row">
          {[200, 140, 130, 100, 100, 100, 110].map((w, i) => (
            <div key={i} className="skel" style={{ height: 32, width: w, borderRadius: 6 }} />
          ))}
        </div>
      </div>

      {/* Genre chips skeleton */}
      <div className="evt-chips mb-4">
        {[60, 80, 60, 70, 60, 70, 50, 65, 75, 55].map((w, i) => (
          <div key={i} className="skel" style={{ height: 28, width: w, borderRadius: 20, display: 'inline-block' }} />
        ))}
      </div>

      {/* Count skeleton */}
      <div className="skel mb-3" style={{ height: 14, width: 120 }} />

      {/* Grid skeleton */}
      <div className="evt-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="card event-card evt-card" style={{ overflow: 'hidden' }}>
            <div className="evt-card__media skel" />
            <div className="evt-card__body" style={{ gap: 8 }}>
              <div className="skel" style={{ height: 14, width: '55%', animationDelay: `${i * 0.05}s` }} />
              <div className="skel" style={{ height: 18, width: '80%', animationDelay: `${i * 0.05 + 0.1}s` }} />
              <div className="skel" style={{ height: 12, width: '45%', animationDelay: `${i * 0.05 + 0.2}s` }} />
              <div className="skel" style={{ height: 32, width: '100%', marginTop: 8, borderRadius: 6, animationDelay: `${i * 0.05 + 0.3}s` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
