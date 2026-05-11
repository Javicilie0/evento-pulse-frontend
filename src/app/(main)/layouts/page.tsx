import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'

interface VenueLayout {
  id: number
  venueName: string
  name: string
  version: number
  status: string
  seats: number
}

async function getLayouts() {
  try {
    const res = await (await authenticatedServerApi()).get<VenueLayout[]>('/api/layouts')
    return res.data
  } catch {
    return []
  }
}

export default async function LayoutsPage() {
  const layouts = await getLayouts()

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Организатор</span>
          <h1 className="groove-panel-title">Схеми на зали</h1>
          <p className="groove-panel-intro mb-0">Списък със seating layout-и, които могат да се закачат към събития.</p>
        </div>
        <Link href="/organizer/dashboard" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> Табло
        </Link>
      </div>

      <div className="groove-paper-card">
        {layouts.length === 0 ? (
          <div className="groove-empty-card m-0">
            <i className="bi bi-grid-3x3-gap" />
            <h2 className="groove-panel-title">Няма схеми</h2>
            <p className="groove-panel-intro">Когато създадеш или дублираш схема, тя ще се появи тук.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover groove-table">
              <thead><tr><th>Зала</th><th>Схема</th><th>Версия</th><th>Места</th><th>Статус</th></tr></thead>
              <tbody>
                {layouts.map(layout => (
                  <tr key={layout.id}>
                    <td>{layout.venueName}</td>
                    <td><strong>{layout.name}</strong></td>
                    <td>v{layout.version}</td>
                    <td>{layout.seats}</td>
                    <td><span className="badge bg-secondary">{layout.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
