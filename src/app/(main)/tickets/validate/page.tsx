'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useSession } from 'next-auth/react'
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

interface ValidationTicket {
  id?: string
  eventTitle: string
  ticketName: string
  ownerUserName: string
  ownerEmail: string
  attendeeName?: string
  startTime: string
  endTime?: string
  address: string
  city: string
  seatLabel?: string
  transactionStatus?: string
  qrCode?: string
  isUsed: boolean
  usedAt?: string
}

interface ValidationResult {
  valid: boolean
  requiresConfirmation?: boolean
  alreadyUsed?: boolean
  notAllowed?: boolean
  notFound?: boolean
  message: string
  ticket?: ValidationTicket
}

interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>
}

interface BarcodeDetectorConstructor {
  new(opts?: { formats: string[] }): BarcodeDetectorInstance
}

interface JsQrResult {
  data: string
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor
    jsQR?: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      options?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' },
    ) => JsQrResult | null
  }
}

function statusClass(result: ValidationResult) {
  if (result.valid) return 'groove-status-badge-success'
  if (result.requiresConfirmation) return 'groove-status-badge-muted'
  if (result.alreadyUsed || result.notAllowed) return 'groove-status-badge-warning'
  return 'groove-status-badge-danger'
}

function formatDate(value?: string, includeEnd?: string) {
  if (!value) return '-'
  const start = new Date(value)
  if (Number.isNaN(start.getTime())) return '-'
  const startLabel = start.toLocaleString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  if (!includeEnd) return startLabel
  const end = new Date(includeEnd)
  return Number.isNaN(end.getTime())
    ? startLabel
    : `${startLabel} - ${end.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}`
}

function paymentLabel(status?: string) {
  if (!status) return '-'
  const normalized = status.toLowerCase()
  if (normalized === 'paid') return 'Платено'
  if (normalized === 'pending') return 'Чака плащане'
  if (normalized === 'failed') return 'Неуспешно'
  if (normalized === 'refunded') return 'Възстановено'
  return status
}

export default function TicketValidatePage() {
  const { data: session } = useSession()
  const roles = session?.user?.roles ?? []
  const dashboardHref = roles.includes('Admin')
    ? '/admin'
    : roles.includes('Organizer')
    ? '/organizer/dashboard'
    : '/account'
  const dashboardLabel = roles.includes('Admin') ? 'Админ' : roles.includes('Organizer') ? 'Организатор' : 'Профил'

  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('Камерата е изключена.')
  const [cameraError, setCameraError] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null)
  const foundRef = useRef(false)

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    foundRef.current = false
    setCameraActive(false)
    setCameraStatus('Камерата е изключена.')
  }, [])

  async function submit(code: string, confirm: boolean) {
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post<ValidationResult>('/api/tickets/validate', { qrCode: trimmed, confirm })
      setResult(res.data)
    } catch (error) {
      const err = error as { response?: { data?: ValidationResult; status?: number } }
      if (err.response?.status === 403) {
        setResult({ valid: false, notAllowed: true, message: 'Нямаш право да валидираш този билет.' })
      } else {
        setResult(err.response?.data ?? { valid: false, message: 'Грешка при валидиране.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const onQrFound = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed || foundRef.current) return
    foundRef.current = true
    setQrCode(trimmed)
    setCameraStatus('QR кодът е намерен. Отварям данните.')
    stopCamera()
    submit(trimmed, false)
  }, [stopCamera])

  async function scanFrame() {
    const video = videoRef.current
    if (!video || foundRef.current) return

    if (video.readyState >= 2) {
      let value = ''
      if (detectorRef.current) {
        try {
          const codes = await detectorRef.current.detect(video)
          value = codes[0]?.rawValue ?? ''
        } catch {
          value = ''
        }
      }

      if (!value && window.jsQR) {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (context) {
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 480
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
          value = code?.data ?? ''
        }
      }

      if (value) {
        onQrFound(value)
        return
      }
    }

    if (!foundRef.current) rafRef.current = requestAnimationFrame(scanFrame)
  }

  async function startCamera() {
    setCameraError('')
    setResult(null)
    foundRef.current = false

    if (!window.isSecureContext) {
      setCameraError('Камерата работи само през HTTPS или localhost.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Браузърът няма достъп до камера.')
      return
    }

    try {
      detectorRef.current = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null
    } catch {
      detectorRef.current = null
    }

    if (!detectorRef.current && !window.jsQR) {
      setCameraError('QR четецът още се зарежда. Опитай отново след секунда или постави кода ръчно.')
      return
    }

    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }

      streamRef.current = stream
      setCameraActive(true)
      setCameraStatus('Насочи камерата към QR кода.')

      setTimeout(async () => {
        const video = videoRef.current
        if (!video || !streamRef.current) return
        video.srcObject = stream
        await video.play()
        rafRef.current = requestAnimationFrame(scanFrame)
      }, 100)
    } catch {
      setCameraError('Камерата не може да се отвори. Провери разрешението в браузъра.')
    }
  }

  async function handleFileCapture(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image load failed'))
      })

      let value = ''
      if (window.BarcodeDetector) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
          const codes = await detector.detect(img)
          value = codes[0]?.rawValue ?? ''
        } catch {
          value = ''
        }
      }

      if (!value && window.jsQR) {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (context) {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          context.drawImage(img, 0, 0)
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          value = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })?.data ?? ''
        }
      }

      URL.revokeObjectURL(img.src)
      if (value) {
        setQrCode(value.trim())
        submit(value, false)
      } else {
        setCameraError('QR кодът не беше разпознат. Опитай отново или постави кода ръчно.')
      }
    } catch {
      setCameraError('Неуспешно разпознаване. Постави кода ръчно.')
    }
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    submit(qrCode, false)
  }

  useEffect(() => () => stopCamera(), [stopCamera])

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js" strategy="afterInteractive" />

      <section className="groove-app-page ticket-validator-page">
        <div className="groove-page-hero">
          <div className="groove-page-hero__copy">
            <span className="groove-stamp groove-stamp-yellow">Вход</span>
            <h1>Сканирай QR кода и потвърди билета.</h1>
            <p>
              Сканирането само отваря информацията за билета. Валидирането става чак след натискане на бутона за потвърждение.
            </p>
          </div>
          <div className="groove-page-actions">
            <Link href={dashboardHref} className="groove-button groove-button-paper">
              <i className="bi bi-arrow-left" /> Към {dashboardLabel}
            </Link>
          </div>
        </div>

        <div className="ticket-validator-grid">
          <div className="groove-form-panel groove-highlight-card ticket-scan-panel">
            <span className="groove-kicker">Проверка</span>
            <h2 className="groove-panel-title">Камера или ръчен код.</h2>
            <p className="groove-panel-intro">Отвори камерата на телефона или постави QR стойността ръчно.</p>

            <div className={`ticket-camera-box ${cameraActive ? 'is-active' : ''}`} aria-live="polite">
              <video ref={videoRef} playsInline muted />
              <div className="ticket-camera-placeholder">
                <i className="bi bi-qr-code-scan" />
                <span>{cameraStatus}</span>
              </div>
            </div>

            <div className="ticket-camera-actions">
              {!cameraActive ? (
                <button type="button" className="groove-button groove-button-dark" onClick={startCamera} disabled={loading}>
                  <i className="bi bi-camera-video" /> Отвори камера
                </button>
              ) : (
                <button type="button" className="groove-button groove-button-paper" onClick={stopCamera}>
                  <i className="bi bi-camera-video-off" /> Спри
                </button>
              )}

              <label className="groove-button groove-button-paper mb-0" style={{ cursor: 'pointer' }}>
                <i className="bi bi-image" /> Снимка от галерия
                <input type="file" accept="image/*" capture="environment" hidden onChange={handleFileCapture} disabled={loading} />
              </label>
            </div>

            {cameraError && (
              <div className="groove-alert groove-alert-warning mt-3" role="alert">
                <i className="bi bi-exclamation-triangle" /> {cameraError}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="mt-4">
              <div className="mb-3">
                <label htmlFor="qrCode" className="form-label">QR код</label>
                <input
                  id="qrCode"
                  className="form-control"
                  autoComplete="off"
                  autoFocus
                  value={qrCode}
                  onChange={e => setQrCode(e.target.value)}
                  placeholder="Постави кода тук..."
                />
              </div>

              <div className="groove-form-actions">
                <button type="submit" className="groove-button groove-button-dark" disabled={loading || !qrCode.trim()}>
                  {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search" />}
                  Провери билета
                </button>
                {qrCode && (
                  <button type="button" className="groove-button groove-button-paper" onClick={() => { setQrCode(''); setResult(null) }}>
                    Изчисти
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="ticket-validation-card">
            {!result ? (
              <>
                <span className="groove-kicker">Резултат</span>
                <h2 className="groove-panel-title">Очаквам сканиране.</h2>
                <p className="groove-panel-intro">Тук ще се появи карта с данните за билета, преди да бъде маркиран като използван.</p>
              </>
            ) : (
              <>
                <span className={`groove-status-badge ${statusClass(result)}`}>{result.message}</span>

                {result.ticket && (
                  <div className="ticket-validation-card__body">
                    <div>
                      <span className="groove-kicker">Билет</span>
                      <h2 className="groove-panel-title">{result.ticket.eventTitle}</h2>
                      <p className="groove-muted-copy">{result.ticket.ticketName}</p>
                    </div>

                    {result.ticket.id && (
                      <img className="ticket-validation-card__qr" src={`/api/tickets/${result.ticket.id}/qr`} alt="QR код" />
                    )}

                    <dl className="groove-data-list ticket-validation-data">
                      <dt>Притежател</dt>
                      <dd>{result.ticket.ownerUserName}</dd>

                      <dt>Имейл</dt>
                      <dd>{result.ticket.ownerEmail}</dd>

                      {result.ticket.attendeeName && (
                        <>
                          <dt>Име на билет</dt>
                          <dd>{result.ticket.attendeeName}</dd>
                        </>
                      )}

                      <dt>Дата</dt>
                      <dd>{formatDate(result.ticket.startTime, result.ticket.endTime)}</dd>

                      <dt>Място</dt>
                      <dd>{result.ticket.city}, {result.ticket.address}</dd>

                      {result.ticket.seatLabel && (
                        <>
                          <dt>Седалка</dt>
                          <dd>{result.ticket.seatLabel}</dd>
                        </>
                      )}

                      <dt>Плащане</dt>
                      <dd>{paymentLabel(result.ticket.transactionStatus)}</dd>

                      <dt>QR</dt>
                      <dd className="ticket-validation-code">{result.ticket.qrCode ?? qrCode}</dd>

                      {result.ticket.isUsed && result.ticket.usedAt && (
                        <>
                          <dt>Използван</dt>
                          <dd>{formatDate(result.ticket.usedAt)}</dd>
                        </>
                      )}
                    </dl>

                    {result.requiresConfirmation && (
                      <div className="ticket-confirm-form">
                        <button className="groove-button groove-button-dark" type="button" disabled={loading} onClick={() => submit(qrCode, true)}>
                          <i className="bi bi-check2-circle" /> Валидирай билета
                        </button>
                      </div>
                    )}

                    {(result.valid || result.alreadyUsed) && (
                      <button className="groove-button groove-button-paper mt-2" type="button" onClick={() => { setResult(null); setQrCode('') }}>
                        <i className="bi bi-arrow-repeat" /> Нова проверка
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
