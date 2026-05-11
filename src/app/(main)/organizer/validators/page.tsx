import { authenticatedServerApi } from '@/lib/serverApi'
import Link from 'next/link'
import ValidatorsClient from './ValidatorsClient'

export const dynamic = 'force-dynamic'

interface ValidatorRow {
  id: number
  validatorUserName: string
  validatorEmail: string
  validatorPhoneNumber?: string | null
  organizerProfileId?: number | null
  organizerProfileName?: string | null
  isActive: boolean
  createdAt: string
}

interface OrganizerProfile {
  id: number
  displayName: string
}

export default async function OrganizerValidatorsPage() {
  const sapi = await authenticatedServerApi()
  const [validatorsRes, profilesRes] = await Promise.all([
    sapi.get<ValidatorRow[]>('/api/organizer/validators').catch(() => ({ data: [] as ValidatorRow[] })),
    sapi.get<OrganizerProfile[]>('/api/organizer/profiles').catch(() => ({ data: [] as OrganizerProfile[] })),
  ])

  return (
    <section className="groove-app-page">
      <div className="groove-section-bar mb-4">
        <div>
          <span className="groove-kicker">Контрол на билети</span>
          <h1 className="groove-panel-title">Достъп за валидатори.</h1>
          <p className="text-muted mb-0">Добавяй до 3 служебни акаунта към всяка public page. Те виждат само QR валидирането за събитията на страницата.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link href="/tickets/validate" className="groove-button groove-button-dark">
            <i className="bi bi-qr-code-scan" /> Валидирай билети
          </Link>
          <Link href="/organizer/dashboard" className="groove-button groove-button-paper">
            <i className="bi bi-arrow-left" /> Табло
          </Link>
        </div>
      </div>

      <ValidatorsClient
        initialValidators={validatorsRes.data}
        initialProfiles={profilesRes.data}
      />
    </section>
  )
}
