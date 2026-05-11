import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'

interface ValidatorRow {
  id: number
  validatorUserName: string
  validatorEmail: string
  organizerProfileName?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

async function getValidators() {
  try {
    const res = await (await authenticatedServerApi()).get<ValidatorRow[]>('/api/organizer/validators')
    return res.data
  } catch {
    return []
  }
}

export default async function OrganizerValidatorsPage() {
  const validators = await getValidators()
  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Организатор</span>
          <h1 className="groove-panel-title">Валидатори</h1>
        </div>
        <Link href="/organizer/dashboard" className="groove-button groove-button-paper"><i className="bi bi-arrow-left" /> Табло</Link>
      </div>
      <div className="groove-paper-card">
        <div className="table-responsive">
          <table className="table table-hover groove-table">
            <thead><tr><th>Потребител</th><th>Страница</th><th>Статус</th><th>Добавен</th></tr></thead>
            <tbody>
              {validators.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.validatorUserName}</strong><div className="small text-muted">{v.validatorEmail}</div></td>
                  <td>{v.organizerProfileName ?? '-'}</td>
                  <td>{v.isActive ? <span className="badge bg-success">Активен</span> : <span className="badge bg-secondary">Спрян</span>}</td>
                  <td>{format(new Date(v.createdAt), 'dd.MM.yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
