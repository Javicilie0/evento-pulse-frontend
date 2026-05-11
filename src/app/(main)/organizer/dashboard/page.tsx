import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

interface DashboardData {
  organizationName: string
  approved: boolean
  eventsCount: number
  postsCount: number
  ticketsSoldCount: number
  totalRevenue: number
  totalLikes: number
  totalViews: number
  last30Views: number
  last30Sold: number
  last30Revenue: number
  upcomingEventsCount: number
  eventTicketRows: Array<{ eventId: number; eventTitle: string; startTime: string; isApproved: boolean; sold: number; views: number; revenue: number }>
}

interface WorkspaceRow { id: number; displayName: string; profilesCount: number; eventsCount: number; isDefault: boolean; status: string }
interface PublicPageRow { id: number; displayName: string; workspaceName?: string; isApproved: boolean; eventsCount: number; postsCount: number }
interface LayoutRow { id: number; name: string; venueName: string; seats: number; status: string }
interface ValidatorRow { id: number; isActive: boolean; organizerProfileId?: number | null }

export default async function OrganizerDashboardPage() {
  const sapi = await authenticatedServerApi()

  const [dashboardRes, workspacesRes, pagesRes, layoutsRes, validatorsRes] = await Promise.all([
    sapi.get<DashboardData>('/api/organizer/dashboard').catch(() => ({ data: null as DashboardData | null })),
    sapi.get<WorkspaceRow[]>('/api/organizer/workspaces').catch(() => ({ data: [] as WorkspaceRow[] })),
    sapi.get<PublicPageRow[]>('/api/organizer/profiles').catch(() => ({ data: [] as PublicPageRow[] })),
    sapi.get<LayoutRow[]>('/api/layouts').catch(() => ({ data: [] as LayoutRow[] })),
    sapi.get<ValidatorRow[]>('/api/organizer/validators').catch(() => ({ data: [] as ValidatorRow[] })),
  ])

  const data = dashboardRes.data
  const workspaces = workspacesRes.data
  const pages = pagesRes.data
  const layouts = layoutsRes.data
  const validators = validatorsRes.data

  const activeValidators = validators.filter(v => v.isActive).length
  const approvedPages = pages.filter(p => p.isApproved).length

  if (!data) {
    return (
      <section className="groove-app-page">
        <div className="groove-empty-card">
          <i className="bi bi-person-badge" />
          <h1 className="groove-panel-title">Организаторско табло</h1>
          <p className="groove-panel-intro">Нямаш създаден организаторски профил към този акаунт.</p>
          <div className="groove-form-actions justify-content-center">
            <Link href="/account/apply" className="groove-button groove-button-dark">
              <i className="bi bi-send" /> Кандидатствай като организатор
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const workflow = [
    { title: 'Workspaces', text: 'Бизнес профили, към които връзваш public pages и плащания.', value: workspaces.length, icon: 'briefcase', href: '/organizer/workspaces', actionHref: '/organizer/workspaces/edit/new', action: 'Нов workspace', ready: workspaces.length > 0 },
    { title: 'Public pages', text: 'Публичните лица на workspace-а. Само те публикуват.', value: `${approvedPages}/${pages.length}`, icon: 'person-badge', href: '/organizer/profiles', actionHref: '/organizer/profiles/edit/new', action: 'Нова страница', ready: pages.length > 0 },
    { title: 'Layouts', text: 'Схеми на зали, сектори, редове, маси и AI генератор.', value: layouts.length, icon: 'grid-3x3-gap', href: '/layouts', actionHref: '/layouts/editor', action: 'Нов layout', ready: layouts.length > 0 },
    { title: 'Events', text: 'Събитията се създават за public page, с билети и layout.', value: data.eventsCount, icon: 'calendar-event', href: '/organizer/events', actionHref: '/events/new', action: 'Ново събитие', ready: data.eventsCount > 0 },
    { title: 'Tickets', text: 'Управление на билети, QR кодове, места и продажби.', value: data.ticketsSoldCount, icon: 'ticket-perforated', href: '/tickets/manage', actionHref: '/tickets/create', action: 'Добави билети', ready: data.ticketsSoldCount > 0 },
    { title: 'Validators', text: 'До 3 валидатора на public page, само QR достъп.', value: activeValidators, icon: 'qr-code-scan', href: '/organizer/validators', actionHref: '/organizer/validators', action: 'Добави валидатор', ready: activeValidators > 0 },
  ]

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Организатор</span>
          <h1 className="groove-panel-title">{data.organizationName}</h1>
          <p className="groove-panel-intro mb-0">Целият workflow е тук: workspace, public pages, layouts, събития, билети, валидатори.</p>
          {!data.approved && (
            <div className="alert alert-warning mt-3 mb-0">Акаунтът ти чака одобрение от администратор.</div>
          )}
        </div>
        <div className="groove-page-actions">
          <Link href="/organizer/workspaces" className="groove-button groove-button-paper">
            <i className="bi bi-briefcase" /> Workspaces
          </Link>
          <Link href="/organizer/profiles" className="groove-button groove-button-paper">
            <i className="bi bi-person-badge" /> Public pages
          </Link>
          <Link href="/events/new" className="groove-button groove-button-dark">
            <i className="bi bi-plus" /> Ново събитие
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="row g-3 mt-2">
        {[
          { label: 'Workspaces', value: workspaces.length, icon: 'briefcase' },
          { label: 'Public pages', value: pages.length, icon: 'person-badge' },
          { label: 'Layouts', value: layouts.length, icon: 'grid-3x3-gap' },
          { label: 'Събития', value: data.eventsCount, icon: 'calendar-event' },
          { label: 'Приход', value: `${data.totalRevenue.toFixed(2)} лв`, icon: 'cash-stack' },
          { label: 'Прегледи (30д)', value: data.last30Views, icon: 'eye' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-4 col-lg-2">
            <div className="groove-paper-card text-center py-3">
              <i className={`bi bi-${s.icon} fs-4 text-primary d-block mb-1`} />
              <div className="fs-5 fw-bold">{s.value}</div>
              <div className="small text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow steps */}
      <div className="groove-paper-card mt-4">
        <div className="d-flex justify-content-between gap-3 align-items-start mb-3">
          <div>
            <span className="groove-kicker">Workflow</span>
            <h2 className="groove-panel-title mb-1">От workspace до QR сканиране</h2>
            <p className="text-muted mb-0">Всички основни стъпки са отделни, но вързани в правилния ред.</p>
          </div>
          <Link href="/inbox" className="groove-button groove-button-paper groove-button--sm">
            <i className="bi bi-chat-dots" /> Съобщения
          </Link>
        </div>
        <div className="row g-3">
          {workflow.map((step, index) => (
            <div key={step.title} className="col-md-6 col-xl-4">
              <article className="border rounded-3 p-3 h-100 bg-white">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <span className="evt-avatar-circle"><i className={`bi bi-${step.icon}`} /></span>
                    <div>
                      <div className="small text-muted">Стъпка {index + 1}</div>
                      <h3 className="h5 mb-0">{step.title}</h3>
                    </div>
                  </div>
                  <span className={`badge ${step.ready ? 'bg-success' : 'bg-secondary'}`}>{step.value}</span>
                </div>
                <p className="text-muted mt-3">{step.text}</p>
                <div className="groove-form-actions mt-3">
                  <Link href={step.href} className="groove-button groove-button-paper groove-button--sm">
                    <i className="bi bi-arrow-right" /> Отвори
                  </Link>
                  <Link href={step.actionHref} className="groove-button groove-button-dark groove-button--sm">
                    <i className="bi bi-plus-lg" /> {step.action}
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* Events table + quick actions */}
      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <div className="groove-paper-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="groove-panel-title mb-0">Последни събития</h2>
              <Link href="/organizer/events" className="groove-button groove-button-paper groove-button--sm">Всички</Link>
            </div>
            {data.eventTicketRows.length === 0 ? (
              <div className="empty-state">Все още няма събития. Започни от public page и ново събитие.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover groove-table align-middle">
                  <thead>
                    <tr>
                      <th>Събитие</th>
                      <th>Дата</th>
                      <th>Статус</th>
                      <th>Продадени</th>
                      <th>Приход</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.eventTicketRows.map(row => (
                      <tr key={row.eventId}>
                        <td><strong>{row.eventTitle}</strong></td>
                        <td>{format(new Date(row.startTime), 'dd.MM.yyyy')}</td>
                        <td>{row.isApproved
                          ? <span className="badge bg-success">Одобрено</span>
                          : <span className="badge bg-warning text-dark">Чака</span>}
                        </td>
                        <td>{row.sold}</td>
                        <td>{row.revenue.toFixed(2)} лв</td>
                        <td className="text-end">
                          <Link href={`/events/${row.eventId}`} className="groove-button groove-button-paper groove-button--sm">Виж</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="groove-paper-card h-100">
            <span className="groove-kicker">Бързи действия</span>
            <h2 className="groove-panel-title mb-3">Следващото най-важно нещо</h2>
            <div className="d-grid gap-2">
              <Link href="/organizer/workspaces/edit/new" className="groove-button groove-button-paper justify-content-start"><i className="bi bi-briefcase" /> Нов workspace</Link>
              <Link href="/organizer/profiles/edit/new" className="groove-button groove-button-paper justify-content-start"><i className="bi bi-person-badge" /> Нова public page</Link>
              <Link href="/layouts/editor" className="groove-button groove-button-paper justify-content-start"><i className="bi bi-grid-3x3-gap" /> Създай layout с AI</Link>
              <Link href="/events/new" className="groove-button groove-button-paper justify-content-start"><i className="bi bi-calendar-plus" /> Създай събитие</Link>
              <Link href="/tickets/create" className="groove-button groove-button-paper justify-content-start"><i className="bi bi-ticket-perforated" /> Добави билети</Link>
              <Link href="/tickets/validate" className="groove-button groove-button-dark justify-content-start"><i className="bi bi-qr-code-scan" /> Валидирай QR</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
