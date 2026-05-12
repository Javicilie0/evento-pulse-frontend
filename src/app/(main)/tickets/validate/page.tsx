'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'

interface ValidationTicket {
  eventTitle: string
  ticketName: string
  ownerUserName: string
  ownerEmail: string
  attendeeName?: string
  startTime: string
  address: string
  city: string
  isUsed: boolean
}

interface ValidationResult {
  valid: boolean
  requiresConfirmation?: boolean
  alreadyUsed?: boolean
  message: string
  ticket?: ValidationTicket
}

// TypeScript declaration for BarcodeDetector (Chrome/Android)
declare global {
  interface Window {
    BarcodeDetector: {
      new(opts?: { formats: string[] }): {
        detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>
      }
      getSupportedFormats(): Promise<string[]>
    }
  }
}

export default function TicketValidatePage() {
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [scanPulse, setScanPulse] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const detectorRef = useRef<InstanceType<typeof window.BarcodeDetector> | null>(null)
  const foundRef = useRef(false)

  async function submit(code: string, confirm: boolean) {
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post<ValidationResult>('/api/tickets/validate', { qrCode: trimmed, confirm })
      setResult(res.data)
    } catch (error) {
      const err = error as { response?: { data?: ValidationResult } }
      setResult(err.response?.data ?? { valid: false, message: 'Грешка при валидиране.' })
    } finally {
      setLoading(false)
    }
  }

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    foundRef.current = false
    setCameraActive(false)
  }, [])

  const onQrFound = useCallback((value: string) => {
    if (foundRef.current) return
    foundRef.current = true
    setScanPulse(true)
    setTimeout(() => setScanPulse(false), 600)
    setQrCode(value)
    stopCamera()
    submit(value, false)
  }, [stopCamera])

  const startScan = useCallback(async () => {
    setCameraError('')
    setResult(null)
    foundRef.current = false

    // Check BarcodeDetector support
    const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      setCameraActive(true)

      // Wait for video to be ready
      setTimeout(async () => {
        if (!videoRef.current || !streamRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        if (hasNativeDetector) {
          detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
        }

        const scan = async () => {
          if (!videoRef.current || foundRef.current) return
          if (videoRef.current.readyState >= 2) {
            if (hasNativeDetector && detectorRef.current) {
              try {
                const results = await detectorRef.current.detect(videoRef.current)
                if (results.length > 0 && results[0].rawValue) {
                  onQrFound(results[0].rawValue)
                  return
                }
              } catch {}
            } else {
              // Fallback: canvas + manual decode hint (no jsQR installed)
              // Just keep scanning visually until user stops
            }
          }
          if (!foundRef.current) {
            rafRef.current = requestAnimationFrame(scan)
          }
        }
        rafRef.current = requestAnimationFrame(scan)
      }, 300)
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Отказан достъп до камерата. Провери настройките на браузъра.'
        : err?.name === 'NotFoundError'
        ? 'Не е намерена камера на това устройство.'
        : 'Камерата не може да бъде отворена.'
      setCameraError(msg)
    }
  }, [onQrFound])

  // File input fallback for iOS or devices without BarcodeDetector live scan
  async function handleFileCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!('BarcodeDetector' in window)) {
      setCameraError('Скенерът не се поддържа в този браузър. Постави кода ръчно.')
      return
    }
    try {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      await new Promise(res => { img.onload = res })
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const results = await detector.detect(img)
      URL.revokeObjectURL(img.src)
      if (results.length > 0 && results[0].rawValue) {
        setQrCode(results[0].rawValue)
        submit(results[0].rawValue, false)
      } else {
        setCameraError('QR кодът не беше разпознат. Опитай отново или постави кода ръчно.')
      }
    } catch {
      setCameraError('Неуспешно разпознаване. Постави кода ръчно.')
    }
  }

  useEffect(() => () => stopCamera(), [stopCamera])

  return (
    <section className="groove-app-page">
      <div className="groove-page-hero">
        <div className="groove-page-hero__copy">
          <span className="groove-stamp groove-stamp-teal">Валидиране</span>
          <h1 className="groove-panel-title">Проверка на билет</h1>
          <p>Сканирай QR кода или постави го ръчно.</p>
        </div>
      </div>

      {/* Camera viewfinder */}
      {cameraActive && (
        <div className="qr-scanner-shell mt-4">
          <div className={`qr-scanner-frame ${scanPulse ? 'qr-scanner-frame--pulse' : ''}`}>
            <video ref={videoRef} playsInline muted className="qr-scanner-video" />
            <div className="qr-scanner-overlay">
              <div className="qr-scanner-corner qr-scanner-corner--tl" />
              <div className="qr-scanner-corner qr-scanner-corner--tr" />
              <div className="qr-scanner-corner qr-scanner-corner--bl" />
              <div className="qr-scanner-corner qr-scanner-corner--br" />
              <div className="qr-scanner-line" />
            </div>
            <p className="qr-scanner-hint">Насочи камерата към QR кода</p>
          </div>
          <button className="groove-button groove-button-paper mt-3 w-100" type="button" onClick={stopCamera}>
            <i className="bi bi-x-circle" /> Затвори камерата
          </button>
        </div>
      )}

      {!cameraActive && (
        <div className="groove-paper-card mt-4">
          {/* Camera buttons */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <button
              className="groove-button groove-button-dark"
              type="button"
              onClick={startScan}
              disabled={loading}
            >
              <i className="bi bi-camera" /> Сканирай с камера
            </button>

            {/* File input fallback - hidden, triggered programmatically via label */}
            <label className="groove-button groove-button-paper mb-0" style={{ cursor: 'pointer' }}>
              <i className="bi bi-image" /> Снимка от галерия
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileCapture}
                disabled={loading}
              />
            </label>
          </div>

          {cameraError && (
            <div className="groove-alert groove-alert-warning mb-3" role="alert">
              <i className="bi bi-exclamation-triangle" /> {cameraError}
            </div>
          )}

          <label className="form-label fw-bold" htmlFor="qrCode">
            Или постави QR кода ръчно
          </label>
          <textarea
            id="qrCode"
            className="form-control"
            rows={3}
            value={qrCode}
            onChange={e => setQrCode(e.target.value)}
            placeholder="Постави кода тук..."
          />
          <div className="groove-form-actions mt-3">
            <button
              className="groove-button groove-button-dark"
              disabled={loading || !qrCode.trim()}
              type="button"
              onClick={() => submit(qrCode, false)}
            >
              {loading
                ? <span className="spinner-border spinner-border-sm" />
                : <i className="bi bi-search" />}
              <span>Провери</span>
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`groove-paper-card mt-4 ${result.valid ? 'border-success' : result.alreadyUsed ? 'border-warning' : 'border-danger'}`}>
          <h2 className="groove-panel-title mb-2">{result.message}</h2>
          {result.ticket && (
            <dl className="groove-data-list mt-3">
              <dt>Събитие</dt>
              <dd>{result.ticket.eventTitle}</dd>
              <dt>Билет</dt>
              <dd>{result.ticket.ticketName}</dd>
              <dt>Притежател</dt>
              <dd>{result.ticket.attendeeName || result.ticket.ownerUserName} ({result.ticket.ownerEmail})</dd>
              <dt>Начало</dt>
              <dd>{new Date(result.ticket.startTime).toLocaleString('bg-BG')}</dd>
              <dt>Локация</dt>
              <dd>{result.ticket.address}, {result.ticket.city}</dd>
            </dl>
          )}
          {result.requiresConfirmation && (
            <button
              className="groove-button groove-button-dark mt-3"
              type="button"
              disabled={loading}
              onClick={() => submit(qrCode, true)}
            >
              <i className="bi bi-check2-circle" /> Потвърди валидиране
            </button>
          )}
          {(result.valid || result.alreadyUsed) && (
            <button
              className="groove-button groove-button-paper mt-3"
              type="button"
              onClick={() => { setResult(null); setQrCode('') }}
            >
              <i className="bi bi-arrow-repeat" /> Нова проверка
            </button>
          )}
        </div>
      )}

      <style>{`
        .qr-scanner-shell { max-width: 400px; margin: 0 auto; }
        .qr-scanner-frame { position: relative; width: 100%; aspect-ratio: 1; background: #000; border-radius: 12px; overflow: hidden; }
        .qr-scanner-frame--pulse { outline: 3px solid #22c55e; outline-offset: 2px; }
        .qr-scanner-video { width: 100%; height: 100%; object-fit: cover; }
        .qr-scanner-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .qr-scanner-corner { position: absolute; width: 28px; height: 28px; border-color: #fff; border-style: solid; border-width: 0; }
        .qr-scanner-corner--tl { top: 16px; left: 16px; border-top-width: 3px; border-left-width: 3px; border-radius: 4px 0 0 0; }
        .qr-scanner-corner--tr { top: 16px; right: 16px; border-top-width: 3px; border-right-width: 3px; border-radius: 0 4px 0 0; }
        .qr-scanner-corner--bl { bottom: 16px; left: 16px; border-bottom-width: 3px; border-left-width: 3px; border-radius: 0 0 0 4px; }
        .qr-scanner-corner--br { bottom: 16px; right: 16px; border-bottom-width: 3px; border-right-width: 3px; border-radius: 0 0 4px 0; }
        .qr-scanner-line {
          position: absolute;
          left: 16px; right: 16px; height: 2px;
          background: rgba(99,102,241,0.8);
          animation: qr-scan 2s ease-in-out infinite;
        }
        .qr-scanner-hint { position: absolute; bottom: 12px; left: 0; right: 0; text-align: center; color: rgba(255,255,255,0.85); font-size: 0.8rem; margin: 0; }
        @keyframes qr-scan {
          0%, 100% { top: 20%; }
          50% { top: 75%; }
        }
      `}</style>
    </section>
  )
}
