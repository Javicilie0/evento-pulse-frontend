import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'

interface Workspace {
  id: number
  displayName: string
  legalName: string
  city?: string
  billingEmail?: string
  status: string
  isDefault: boolean
  paymentProvider: string
  stripeOnboardingStatus: string
  payoutsEnabled: boolean
  chargesEnabled: boolean
  profilesCount: number
  eventsCount: number
  transactionsCount: number
  createdAt: string
}

async function getWorkspaces() {
  try {
    const res = await (await authenticatedServerApi()).get<Workspace[]>('/api/organizer/workspaces')
    return res.data
  } catch {
    return []
  }
}

export default async function OrganizerWorkspacesPage() {
  const workspaces = await getWorkspaces()

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Организатор</span>
          <h1 className="groove-panel-title">Работни пространства</h1>
        </div>
        <Link href="/organizer/dashboard" className="groove-button groove-button-paper">
          <i className="bi bi-arrow-left" /> Табло
        </Link>
      </div>

      <div className="row g-3">
        {workspaces.length === 0 ? (
          <div className="col-12">
            <div className="groove-empty-card">
              <i className="bi bi-briefcase" />
              <h2 className="groove-panel-title">Няма работни пространства</h2>
              <p className="groove-panel-intro">След одобрение на организатор тук ще се показват бизнес профилите.</p>
            </div>
          </div>
        ) : workspaces.map(workspace => (
          <div key={workspace.id} className="col-md-6 col-xl-4">
            <article className="groove-paper-card h-100">
              <div className="d-flex justify-content-between gap-2">
                <div>
                  <h2 className="h5 mb-1">{workspace.displayName}</h2>
                  <p className="small text-muted mb-0">{workspace.legalName}</p>
                </div>
                {workspace.isDefault && <span className="badge bg-primary align-self-start">Основно</span>}
              </div>
              <dl className="groove-data-list mt-3 mb-0">
                <dt>Град</dt><dd>{workspace.city ?? '-'}</dd>
                <dt>Имейл</dt><dd>{workspace.billingEmail ?? '-'}</dd>
                <dt>Статус</dt><dd>{workspace.status}</dd>
                <dt>Профили</dt><dd>{workspace.profilesCount}</dd>
                <dt>Събития</dt><dd>{workspace.eventsCount}</dd>
                <dt>Създадено</dt><dd>{format(new Date(workspace.createdAt), 'dd.MM.yyyy')}</dd>
              </dl>
            </article>
          </div>
        ))}
      </div>
    </section>
  )
}
