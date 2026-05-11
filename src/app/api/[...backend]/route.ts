import { auth } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7180'

async function proxy(request: Request, { params }: { params: Promise<{ backend: string[] }> }) {
  const { backend } = await params
  const session = await auth()
  const url = new URL(request.url)
  const target = `${API_URL}/api/${backend.join('/')}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length')
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  const method = request.method.toUpperCase()
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer()
  const res = await fetch(target, {
    method,
    headers,
    body,
    cache: 'no-store',
  })

  const responseHeaders = new Headers(res.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
