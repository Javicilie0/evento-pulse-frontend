import { auth } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7180'

export async function authenticatedServerApi() {
  const session = await auth()
  const token = session?.accessToken

  async function get<T = unknown>(path: string, options?: { params?: Record<string, string>; revalidate?: number | false }): Promise<{ data: T }> {
    const url = new URL(API_URL + path)
    if (options?.params) {
      Object.entries(options.params).forEach(([k, v]) => { if (v !== undefined && v !== '') url.searchParams.set(k, v) })
    }
    const cacheOption: RequestInit =
      options?.revalidate === false
        ? { cache: 'no-store' }
        : options?.revalidate !== undefined
        ? { next: { revalidate: options.revalidate } }
        : { cache: 'no-store' }

    const res = await fetch(url.toString(), {
      ...cacheOption,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) {
      const err = new Error(`API ${res.status}: ${path}`) as Error & { status: number }
      err.status = res.status
      throw err
    }
    const data = await res.json() as T
    return { data }
  }

  async function post<T = unknown>(path: string, body?: unknown): Promise<{ data: T }> {
    const res = await fetch(API_URL + path, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = new Error(`API ${res.status}: ${path}`) as Error & { status: number }
      err.status = res.status
      throw err
    }
    const data = await res.json() as T
    return { data }
  }

  return { get, post }
}
