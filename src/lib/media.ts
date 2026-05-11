const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:7180'

export function mediaUrl(url?: string | null) {
  if (!url) return undefined
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${API_URL}${url}`
  return `${API_URL}/${url.replace(/^\/+/, '')}`
}
