import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

interface DashboardData {
  organizationName: string
  description?: string
  phoneNumber?: string
  website?: string
  approved: boolean
  eventsCount: number
  postsCount: number
  ticketTypesCount?: number
  ticketsSoldCount: number
  eventsWithTicketsCount?: number
  layoutsCount?: number
  totalRevenue: number
  totalLikes: number
  totalComments?: number
  totalViews: number
  last30Views: number
  last30DaysViews?: number
  last30Sold: number
  last30DaysSold?: number
  last30Revenue: number
  last30DaysRevenue?: number
  upcomingEventsCount: number
  pastEventsCount?: number
  ticketsUsedCount?: number
  vipBoostCreditsAvailable?: number
  vipBoostCreditsUsed?: number
  recentEvents?: RecentEvent[]
  recentPosts?: RecentPost[]
  eventTicketRows: EventTicketRow[]
}

interface RecentEvent {
  id: number
  title: string
  city?: string
  startTime?: string
  isApproved?: boolean
  likesCount?: number
  commentsCount?: number
}

interface RecentPost {
  id: number
  content: string
  createdAt?: string
  likesCount?: number
  commentsCount?: number
}

interface EventTicketRow {
  eventId: number
  eventTitle: string
  startTime: string
  isApproved: boolean
  hasPendingChanges?: boolean
  hasActiveTickets?: boolean
  sold: number
  likes?: number
  comments?: number
  views: number
  uniqueViewers?: number
  vipBoostScore?: number
  revenue: number
}

interface WorkspaceRow {
  id: number
  displayName: string
  legalName?: string
  profilesCount: number
  eventsCount: number
  isDefault: boolean
  status: string
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  paymentProvider?: string
  stripeOnboardingStatus?: string
}

interface PublicPageRow {
  id: number
  displayName: string
  workspaceName?: string
  businessWorkspaceId?: number
  isDefault?: boolean
  isApproved: boolean
  isActive?: boolean
  eventsCount: number
  postsCount: number
}

interface LayoutRow {
  id: number
  name: string
  venueName: string
  seats: number
  status: string
}

interface ValidatorRow {
  id: number
  isActive: boolean
  organizerProfileId?: number | null
}

function money(value?: number) {
  return `${(value ?? 0).toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} лв.`
}

function date(value?: string, pattern = 'dd.MM.yyyy') {
  if (!value) return '-'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : format(parsed, pattern)
}

function statusBadge(approved?: boolean, pending?: boolean) {
  if (pending) return <span className="groove-status-badge groove-status-badge-warning">Промени за преглед</span>
  if (approved) return <span className="groove-status-badge groove-status-badge-success">Одобрено</span>
  return <span className="groove-status-badge groove-status-badge-warning groove-status-badge-pending">Чака</span>
}

function progressWidth(value: number, max: number) {
  if (max <= 0) return '0%'
  return `${Math.max(4, Math.min(100, Math.round((value / max) * 100)))}%`
}

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

  if (!data) {
    return (
      <section className="groove-app-page">
        <div className="groove-empty-card">
          <i className="bi bi-person-badge" />
          <h1 className="groove-panel-title" data-i18n-html="org.setup.h1">Нека подредим твоя <span>организаторски профил</span>.</h1>
          <p className="groove-panel-intro" data-i18n="org.setup.p">
            Добави име на организация, описание и контакти, за да започнеш да публикуваш събития и билети.
          </p>
          <div className="groove-form-actions justify-content-center">
            <Link href="/account/apply" className="groove-button groove-button-dark">
              <i className="bi bi-pencil-square" /> <span data-i18n="org.setup.btn">Попълни профила</span>
            </Link>
            <Link href="/organizer/workspaces" className="groove-button groove-button-paper">
              <i className="bi bi-building" /> Workspaces
            </Link>
            <Link href="/organizer/workspaces/edit/new" className="groove-button groove-button-paper">
              <i className="bi bi-building-add" /> New workspace
            </Link>
            <Link href="/profile/me" className="groove-button groove-button-paper">
              <i className="bi bi-person-lines-fill" /> Public profile
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const activeWorkspace = workspaces.find(w => w.isDefault) ?? workspaces[0]
  const activePage = pages.find(p => p.isDefault) ?? pages[0]
  const approvedPages = pages.filter(p => p.isApproved).length
  const activeValidators = validators.filter(v => v.isActive).length
  const totalComments = data.totalComments ?? data.eventTicketRows.reduce((sum, row) => sum + (row.comments ?? 0), 0)
  const last30Sold = data.last30DaysSold ?? data.last30Sold
  const last30Revenue = data.last30DaysRevenue ?? data.last30Revenue
  const last30Views = data.last30DaysViews ?? data.last30Views
  const ticketTypesCount = data.ticketTypesCount ?? data.eventTicketRows.filter(row => row.hasActiveTickets || row.sold > 0).length
  const eventsWithTicketsCount = data.eventsWithTicketsCount ?? data.eventTicketRows.filter(row => row.hasActiveTickets || row.sold > 0).length
  const vipAvailable = data.vipBoostCreditsAvailable ?? 0
  const vipUsed = data.vipBoostCreditsUsed ?? 0
  const averageTicket = data.ticketsSoldCount > 0 ? data.totalRevenue / data.ticketsSoldCount : 0
  const maxSold = Math.max(1, ...data.eventTicketRows.map(row => row.sold))
  const maxRevenue = Math.max(1, ...data.eventTicketRows.map(row => row.revenue))
  const maxViews = Math.max(1, ...data.eventTicketRows.map(row => row.views))
  const hasOrganizerPage = !!activePage || pages.length > 0
  const hasEvent = data.eventsCount > 0
  const hasTickets = ticketTypesCount > 0
  const hasBoostReady = vipAvailable > 0
  const paymentStatus = activeWorkspace
    ? activeWorkspace.chargesEnabled && activeWorkspace.payoutsEnabled
      ? 'Плащанията са активни'
      : activeWorkspace.stripeOnboardingStatus ?? activeWorkspace.status
    : 'Няма активен workspace'

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal" data-i18n="nav.organizer">Организатор</span>
          <h1>{data.organizationName}</h1>
          <p>
            {data.description || 'Това е твоето работно табло за събития, публикации, билети и входна проверка.'}
          </p>
          <div className="groove-inline-actions mt-3">
            <span className={`groove-status-badge ${data.approved ? 'groove-status-badge-success' : 'groove-status-badge-warning groove-status-badge-pending'}`}>
              {data.approved ? <span data-i18n="org.approved">Одобрен профил</span> : <span data-i18n="org.pending">Чака одобрение</span>}
            </span>
            {data.phoneNumber && <span className="groove-badge"><i className="bi bi-telephone" /> {data.phoneNumber}</span>}
            {data.website && <a href={data.website} target="_blank" rel="noopener noreferrer" className="groove-link" data-i18n="org.website">Уебсайт</a>}
          </div>
        </div>

        <div className="groove-page-actions">
          <Link href="/events/new" className="groove-button groove-button-dark">
            <i className="bi bi-calendar-plus" /> <span data-i18n="org.newevent">Ново събитие</span>
          </Link>
          <Link href="/flow/new" className="groove-button groove-button-paper">
            <i className="bi bi-pencil-square" /> <span data-i18n="org.newpost">Нова публикация</span>
          </Link>
          <Link href="/layouts" className="groove-button groove-button-paper">
            <i className="bi bi-grid-3x3-gap" /> <span data-i18n="layout.my">Моите layout-и</span>
          </Link>
          <Link href="/account/edit-application" className="groove-button groove-button-paper">
            <i className="bi bi-person-gear" /> <span data-i18n="org.editprofile">Редактирай профила</span>
          </Link>
          <Link href="/profile/me" className="groove-button groove-button-paper">
            <i className="bi bi-person-lines-fill" /> Public profile
          </Link>
        </div>
      </div>

      <section className="organizer-command-grid my-4" aria-label="Основни действия">
        <Link href="/tickets/validate" className="organizer-command-card organizer-command-card--primary">
          <i className="bi bi-qr-code-scan" />
          <span>Валидиране</span>
          <strong>Сканирай QR на входа</strong>
        </Link>
        <a href="#org-revenue" className="organizer-command-card">
          <i className="bi bi-cash-coin" />
          <span>Приходи</span>
          <strong>{money(data.totalRevenue)}</strong>
        </a>
        <a href="#org-tickets" className="organizer-command-card">
          <i className="bi bi-ticket-perforated" />
          <span>Билети</span>
          <strong>{data.ticketsSoldCount} продадени</strong>
        </a>
        <a href="#org-engagement" className="organizer-command-card">
          <i className="bi bi-bell" />
          <span>Ангажираност</span>
          <strong>{data.totalLikes + totalComments} реакции</strong>
        </a>
        <Link href="/organizer/events" className="organizer-command-card">
          <i className="bi bi-calendar-event" />
          <span>Събития</span>
          <strong>{data.eventsCount} общо</strong>
        </Link>
        <Link href="/organizer/validators" className="organizer-command-card">
          <i className="bi bi-person-check" />
          <span>Валидатори</span>
          <strong>Достъп за екипа</strong>
        </Link>
      </section>

      {vipAvailable > 0 && (
        <section className="organizer-boost-celebration my-4">
          <div>
            <span className="groove-kicker">Organizer boost</span>
            <h2>Имаш {vipAvailable} VIP boost {vipAvailable === 1 ? 'кредит' : 'кредита'}.</h2>
            <p>Използвай boost върху най-важното си събитие, за да се показва по-високо в Home и препоръките.</p>
          </div>
          <div className="organizer-boost-celebration__actions">
            <Link href="/organizer/events" className="groove-button groove-button-dark">
              <i className="bi bi-stars" /> Избери събитие
            </Link>
          </div>
        </section>
      )}

      <section className="organizer-help-grid my-4" aria-label="Помощ за организатора">
        <article className="organizer-help-card">
          <span className="groove-kicker">Първи стъпки</span>
          <h2>Публикувай без да се чудиш кое следва.</h2>
          <ul className="organizer-checklist">
            <li className={hasOrganizerPage ? 'is-done' : ''}><i className={`bi ${hasOrganizerPage ? 'bi-check-circle-fill' : 'bi-circle'}`} /> Public page</li>
            <li className={hasEvent ? 'is-done' : ''}><i className={`bi ${hasEvent ? 'bi-check-circle-fill' : 'bi-circle'}`} /> Първо събитие</li>
            <li className={hasTickets ? 'is-done' : ''}><i className={`bi ${hasTickets ? 'bi-check-circle-fill' : 'bi-circle'}`} /> Билети или free вход</li>
            <li className={hasBoostReady ? 'is-done' : ''}><i className={`bi ${hasBoostReady ? 'bi-stars' : 'bi-circle'}`} /> VIP boost готов</li>
          </ul>
        </article>
        <article className="organizer-help-card organizer-help-card--soft">
          <span className="groove-kicker">Съвет</span>
          <h2>Преди да пуснеш събитие</h2>
          <p>Провери снимка, public page, дати, билети и как изглежда страницата за потребителите. Ако редактираш вече одобрено събитие, старото остава видимо, докато admin одобри новите промени.</p>
          <div className="d-flex flex-wrap gap-2">
            <Link href="/events/new" className="groove-button groove-button-paper">
              <i className="bi bi-calendar-plus" /> Ново събитие
            </Link>
            <Link href="/organizer/events" className="groove-button groove-button-paper">
              <i className="bi bi-list-check" /> Моите събития
            </Link>
          </div>
        </article>
      </section>

      <section className="groove-table-card my-4" style={{ padding: '1rem' }}>
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
          <div>
            <span className="groove-kicker" data-i18n="workspace.active.context">Active publishing context</span>
            <h2 className="h5 mb-2">{activeWorkspace?.displayName ?? 'Няма активен workspace'}</h2>
            <div className="d-flex flex-wrap gap-2">
              <span className="groove-badge"><i className="bi bi-building" /> <span data-i18n="workspace.label">Workspace</span>: {activeWorkspace?.displayName ?? '-'}</span>
              <span className="groove-badge"><i className="bi bi-megaphone" /> <span data-i18n="workspace.publish.as">Publishing as</span>: {activePage?.displayName ?? '-'}</span>
              <span className="groove-badge"><i className="bi bi-credit-card" /> <span data-i18n="workspace.payments.to">Payments go to</span>: {activeWorkspace?.displayName ?? '-'}</span>
              <span className="groove-status-badge groove-status-badge-warning">{paymentStatus}</span>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <Link href="/organizer/workspaces" className="groove-button groove-button-paper">
                <i className="bi bi-building" /> <span data-i18n="workspace.all">All workspaces</span>
              </Link>
              <Link href="/organizer/workspaces/edit/new" className="groove-button groove-button-dark">
                <i className="bi bi-building-add" /> <span data-i18n="workspace.new">New workspace</span>
              </Link>
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row gap-2 align-items-md-end">
            <div>
              <label className="form-label small mb-1" htmlFor="workspaceId" data-i18n="workspace.switch.workspace">Workspace</label>
              <select id="workspaceId" className="form-select" defaultValue={activeWorkspace?.id ?? ''} disabled>
                {workspaces.length === 0 && <option value="">Няма workspace</option>}
                {workspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.displayName}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label small mb-1" htmlFor="pageId" data-i18n="workspace.switch.page">Page</label>
              <select id="pageId" className="form-select" defaultValue={activePage?.id ?? ''} disabled>
                {pages.length === 0 && <option value="">Няма public page</option>}
                {pages.map(page => <option key={page.id} value={page.id}>{page.displayName}</option>)}
              </select>
            </div>
            <Link href="/organizer/profiles" className="groove-button groove-button-dark">
              <i className="bi bi-arrow-repeat" /> Управлявай
            </Link>
          </div>
        </div>
      </section>

      <div className="groove-stat-grid">
        <a href="#org-revenue" className="groove-stat-card text-decoration-none text-reset">
          <span data-i18n="org.stat.revenue">Приходи (общо)</span>
          <strong>{money(data.totalRevenue)}</strong>
          <small className="text-muted"><span data-i18n="org.stat.avgticket">Среден билет:</span> {money(averageTicket)}</small>
        </a>
        <a href="#org-tickets" className="groove-stat-card text-decoration-none text-reset">
          <span data-i18n="org.stat.sold">Продадени билети</span>
          <strong>{data.ticketsSoldCount}</strong>
          <small className="text-muted"><span data-i18n="org.stat.scanned">Сканирани:</span> {data.ticketsUsedCount ?? 0}</small>
        </a>
        <a href="#org-revenue" className="groove-stat-card text-decoration-none text-reset">
          <span data-i18n="org.stat.last30">Последни 30 дни</span>
          <strong>{last30Sold} <span data-i18n="org.stat.pcs">бр.</span></strong>
          <small className="text-muted">{money(last30Revenue)}</small>
        </a>
        <Link href="/organizer/events" className="groove-stat-card text-decoration-none text-reset">
          <span data-i18n="org.stat.events">Събития</span>
          <strong>{data.eventsCount}</strong>
          <small className="text-muted">
            <span data-i18n="org.stat.upcoming">Предстоящи:</span> {data.upcomingEventsCount}
            {' · '}
            <span data-i18n="org.stat.past">минали:</span> {data.pastEventsCount ?? 0}
          </small>
        </Link>
        <a href="#org-tickets" className="groove-stat-card text-decoration-none text-reset">
          <span data-i18n="org.stat.tickettypes">Видове билети</span>
          <strong>{ticketTypesCount}</strong>
          <small className="text-muted"><span data-i18n="org.stat.activeevents">Активни събития:</span> {eventsWithTicketsCount}</small>
        </a>
        <a href="#org-engagement" className="groove-stat-card text-decoration-none text-reset">
          <span data-i18n="org.stat.engagement">Ангажираност</span>
          <strong>{data.totalLikes} <i className="bi bi-heart-fill text-danger" /></strong>
          <small className="text-muted">
            {totalComments} <span data-i18n="org.stat.comments">коментара</span>
            {' · '}
            {data.postsCount} <span data-i18n="org.stat.posts">публикации</span>
          </small>
        </a>
      </div>

      <section className="groove-table-card my-4" style={{ padding: '1rem' }}>
        <div className="row g-3">
          <div className="col-md-6">
            <span className="groove-kicker">Гледания</span>
            <h2 className="h5 mb-1">{data.totalViews} общо</h2>
            <p className="text-muted mb-0">{last30Views} гледания през последните 30 дни.</p>
          </div>
          <div className="col-md-6">
            <span className="groove-kicker">VIP boost</span>
            <h2 className="h5 mb-1">{vipAvailable} налични</h2>
            <p className="text-muted mb-0">{vipUsed} използвани. Нов organizer започва с 1 free boost.</p>
          </div>
        </div>
      </section>

      <section className="groove-page-section" id="org-engagement">
        <div className="groove-section-bar">
          <div>
            <span className="groove-kicker">Ангажираност</span>
            <h2>Силни събития и последни реакции.</h2>
          </div>
        </div>
        <div className="organizer-dashboard-split">
          <article className="groove-table-card p-3">
            <span className="groove-kicker">Топ по гледания</span>
            <div className="d-grid gap-3 mt-3">
              {data.eventTicketRows.length === 0 ? (
                <div className="social-empty-inline">Още няма активност.</div>
              ) : data.eventTicketRows
                .slice()
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)
                .map(row => (
                  <Link key={row.eventId} href={`/events/${row.eventId}`} className="text-decoration-none text-reset">
                    <div className="d-flex justify-content-between gap-3 mb-1">
                      <strong>{row.eventTitle}</strong>
                      <span>{row.views}</span>
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div className="progress-bar" style={{ width: progressWidth(row.views, maxViews) }} />
                    </div>
                  </Link>
                ))}
            </div>
          </article>
          <article className="groove-table-card p-3">
            <span className="groove-kicker">Последни публикации</span>
            <div className="d-grid gap-3 mt-3">
              {data.recentPosts?.length ? data.recentPosts.map(post => (
                <Link key={post.id} href={`/posts/${post.id}`} className="text-decoration-none text-reset">
                  <strong className="d-block">{post.content.length > 110 ? `${post.content.slice(0, 110)}...` : post.content}</strong>
                  <small className="text-muted">{date(post.createdAt, 'dd.MM HH:mm')} · {post.likesCount ?? 0} харесвания · {post.commentsCount ?? 0} коментара</small>
                </Link>
              )) : (
                <div className="social-empty-inline">Още няма публикации.</div>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="groove-page-section" id="org-revenue">
        <div className="groove-section-bar">
          <div>
            <span className="groove-kicker">Аналитика</span>
            <h2>Продажби и приходи.</h2>
          </div>
        </div>
        <div className="organizer-dashboard-split">
          <article className="groove-table-card p-3">
            <span className="groove-kicker">Топ по продадени билети</span>
            <div className="d-grid gap-3 mt-3">
              {data.eventTicketRows.length === 0 ? (
                <div className="social-empty-inline">Още няма продажби.</div>
              ) : data.eventTicketRows
                .slice()
                .sort((a, b) => b.sold - a.sold)
                .slice(0, 5)
                .map(row => (
                  <Link key={row.eventId} href={`/events/${row.eventId}`} className="text-decoration-none text-reset">
                    <div className="d-flex justify-content-between gap-3 mb-1">
                      <strong>{row.eventTitle}</strong>
                      <span>{row.sold}</span>
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div className="progress-bar bg-success" style={{ width: progressWidth(row.sold, maxSold) }} />
                    </div>
                  </Link>
                ))}
            </div>
          </article>
          <article className="groove-table-card p-3">
            <span className="groove-kicker">Топ по приходи</span>
            <div className="d-grid gap-3 mt-3">
              {data.eventTicketRows.length === 0 ? (
                <div className="social-empty-inline">Още няма приходи.</div>
              ) : data.eventTicketRows
                .slice()
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map(row => (
                  <Link key={row.eventId} href={`/events/${row.eventId}`} className="text-decoration-none text-reset">
                    <div className="d-flex justify-content-between gap-3 mb-1">
                      <strong>{row.eventTitle}</strong>
                      <span>{money(row.revenue)}</span>
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div className="progress-bar bg-danger" style={{ width: progressWidth(row.revenue, maxRevenue) }} />
                    </div>
                  </Link>
                ))}
            </div>
          </article>
        </div>
      </section>

      <section className="groove-page-section" id="org-tickets">
        <div className="groove-section-bar">
          <div>
            <span className="groove-kicker" data-i18n="org.kicker.sales">Продажби</span>
            <h2 data-i18n-html="org.tickets.h2">Билети по <span>събития</span>.</h2>
          </div>
          <Link href="/organizer/events" className="groove-link">Всички събития</Link>
        </div>

        {data.eventTicketRows.length === 0 ? (
          <div className="groove-table-card p-3">
            <div className="social-empty-inline">Още няма събития с билети.</div>
          </div>
        ) : (
          <div className="groove-table-card">
            <div className="groove-table-wrap organizer-events-wrap">
              <table className="table organizer-dashboard-table organizer-dashboard-table--events">
                <thead>
                  <tr>
                    <th data-i18n="org.th.event">Събитие</th>
                    <th data-i18n="org.th.start">Начало</th>
                    <th data-i18n="org.th.status">Статус</th>
                    <th data-i18n="org.th.sold">Продадени</th>
                    <th>Приходи</th>
                    <th>Гледания</th>
                    <th>VIP</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.eventTicketRows.map(row => (
                    <tr key={row.eventId} className={`organizer-event-row ${row.vipBoostScore ? 'is-vip-boosted' : ''}`}>
                      <td data-label="Събитие">
                        <strong>{row.eventTitle}</strong>
                      </td>
                      <td data-label="Начало">{date(row.startTime, 'dd.MM.yyyy HH:mm')}</td>
                      <td data-label="Статус">
                        {row.hasActiveTickets || row.sold > 0
                          ? <span className="groove-status-badge groove-status-badge-success" data-i18n="org.badge.active">Активни билети</span>
                          : statusBadge(row.isApproved, row.hasPendingChanges)}
                      </td>
                      <td data-label="Продадени">{row.sold}</td>
                      <td data-label="Приходи">{money(row.revenue)}</td>
                      <td data-label="Гледания">
                        <strong>{row.views}</strong>
                        <span className="text-muted small d-block">{row.uniqueViewers ?? row.views} уникални</span>
                      </td>
                      <td data-label="VIP">
                        {row.vipBoostScore ? (
                          <span className="evt-card__chip evt-card__chip--vip organizer-vip-badge" style={{ position: 'static' }}>VIP x{row.vipBoostScore}</span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td data-label="Действия">
                        <div className="groove-list-actions">
                          <Link href={`/events/${row.eventId}/edit`} className="groove-button groove-button-paper">
                            <i className="bi bi-pencil" /> <span data-i18n="org.btn.edit">Редакция</span>
                          </Link>
                          <Link href={`/tickets/manage/${row.eventId}`} className="groove-button groove-button-dark">
                            <i className="bi bi-ticket-perforated" /> <span data-i18n="org.btn.tickets">Билети</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {data.recentEvents?.length ? (
        <section className="groove-page-section">
          <div className="groove-section-bar">
            <div>
              <span className="groove-kicker" data-i18n="org.kicker.catalog">Каталог</span>
              <h2 data-i18n-html="org.recent.events.h2">Последни <span>събития</span>.</h2>
            </div>
          </div>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
            {data.recentEvents.map(event => (
              <div key={event.id} className="col">
                <Link href={`/events/${event.id}`} className="groove-paper-card h-100 d-block text-decoration-none text-reset">
                  <span className="groove-kicker">{event.city ?? 'Събитие'}</span>
                  <h3 className="h5 mt-2">{event.title}</h3>
                  <p className="text-muted mb-2">{date(event.startTime, 'dd.MM.yyyy HH:mm')}</p>
                  <div className="d-flex gap-2 flex-wrap">
                    {statusBadge(event.isApproved)}
                    <span className="groove-badge"><i className="bi bi-heart" /> {event.likesCount ?? 0}</span>
                    <span className="groove-badge"><i className="bi bi-chat" /> {event.commentsCount ?? 0}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="groove-page-section">
        <div className="groove-section-bar">
          <div>
            <span className="groove-kicker">Workflow</span>
            <h2>От workspace до QR сканиране.</h2>
          </div>
          <Link href="/inbox" className="groove-button groove-button-paper groove-button--sm">
            <i className="bi bi-chat-dots" /> Съобщения
          </Link>
        </div>
        <div className="groove-mini-grid">
          {[
            { title: 'Workspaces', text: 'Бизнес профили, към които връзваш public pages и плащания.', value: workspaces.length, icon: 'briefcase', href: '/organizer/workspaces', actionHref: '/organizer/workspaces/edit/new', action: 'Нов workspace', ready: workspaces.length > 0 },
            { title: 'Public pages', text: 'Публичните лица на workspace-а. Само те публикуват.', value: `${approvedPages}/${pages.length}`, icon: 'person-badge', href: '/organizer/profiles', actionHref: '/organizer/profiles/edit/new', action: 'Нова страница', ready: pages.length > 0 },
            { title: 'Layouts', text: 'Схеми на зали, сектори, редове, маси и AI генератор.', value: layouts.length, icon: 'grid-3x3-gap', href: '/layouts', actionHref: '/layouts/editor', action: 'Нов layout', ready: layouts.length > 0 },
            { title: 'Events', text: 'Събитията се създават за public page, с билети и layout.', value: data.eventsCount, icon: 'calendar-event', href: '/organizer/events', actionHref: '/events/new', action: 'Ново събитие', ready: data.eventsCount > 0 },
            { title: 'Tickets', text: 'Управление на билети, QR кодове, места и продажби.', value: data.ticketsSoldCount, icon: 'ticket-perforated', href: '/tickets/manage', actionHref: '/tickets/create', action: 'Добави билети', ready: data.ticketsSoldCount > 0 },
            { title: 'Validators', text: 'До 3 валидатора на public page, само QR достъп.', value: activeValidators, icon: 'qr-code-scan', href: '/organizer/validators', actionHref: '/organizer/validators', action: 'Добави валидатор', ready: activeValidators > 0 },
          ].map((step, index) => (
            <article key={step.title} className="groove-paper-card admin-action-card">
              <span className="groove-kicker">Стъпка {index + 1}</span>
              <h3 className="mt-2"><i className={`bi bi-${step.icon}`} /> {step.title}</h3>
              <p>{step.text}</p>
              <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                <span className={`badge ${step.ready ? 'bg-success' : 'bg-secondary'}`}>{step.value}</span>
                <Link href={step.href} className="admin-action-card__cta">Отвори</Link>
              </div>
              <Link href={step.actionHref} className="groove-button groove-button-dark groove-button--sm mt-3">
                <i className="bi bi-plus-lg" /> {step.action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
