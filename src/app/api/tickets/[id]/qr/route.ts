import { auth } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7180'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.accessToken) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  const res = await fetch(`${API_URL}/api/tickets/${id}/qr`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  })

  if (!res.ok) return new Response(await res.text(), { status: res.status })
  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/png',
      'Cache-Control': 'private, no-store',
    },
  })
}
