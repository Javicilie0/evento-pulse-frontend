import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PROTECTED_PREFIXES = [
  '/events/new',
  '/flow/new',
  '/inbox',
  '/profile/edit',
  '/messages',
  '/tickets',
  '/organizer',
  '/admin',
  '/preferences',
  '/layouts',
  '/wrapped',
  '/search',
  '/account',
]

const ORGANIZER_PREFIXES = [
  '/organizer',
  '/layouts/editor',
  '/events/new',
  '/tickets/manage',
  '/tickets/create',
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!session) return NextResponse.next()

  const user = session.user as { roles?: string[] } | undefined
  const roles = user?.roles ?? []
  const isAdmin = roles.includes('Admin')
  const isOrganizer = roles.includes('Organizer') || isAdmin

  // Admin-only routes
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Organizer-only routes
  if (ORGANIZER_PREFIXES.some((p) => pathname.startsWith(p)) && !isOrganizer) {
    return NextResponse.redirect(new URL('/account/apply', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
