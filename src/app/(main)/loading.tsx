export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        flexDirection: 'column',
        gap: '1rem',
        color: 'var(--groove-ink-muted, #5f6b76)',
      }}
    >
      <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
        <span className="visually-hidden">Зарежда...</span>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
        Зарежда…
      </span>
    </div>
  )
}
