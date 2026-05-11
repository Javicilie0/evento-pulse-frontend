import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const AUTHED_PREFIXES = [
  '/organizer',
  '/admin',
  '/inbox',
  '/account',
  '/tickets/manage',
  '/tickets/create',
  '/tickets/scan',
  '/tickets/validate',
  '/tickets/edit',
  '/layouts/editor',
  '/flow/new',
  '/events/new',
  '/wrapped',
  '/preferences',
]

const ORGANIZER_PREFIXES = [
  '/organizer',
  '/layouts/editor',
  '/events/new',
  '/tickets/manage',
  '/tickets/create',
]

const ADMIN_PREFIXES = ['/admin']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isAuthed = !!session

  // Redirect unauthenticated users trying to access protected pages
  if (AUTHED_PREFIXES.some(p => pathname.startsWith(p)) && !isAuthed) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!isAuthed) return NextResponse.next()

  const roles: string[] = (session?.user as any)?.roles ?? []
  const isAdmin = roles.includes('Admin')
  const isOrganizer = roles.includes('Organizer') || isAdmin

  // Admin-only routes
  if (ADMIN_PREFIXES.some(p => pathname.startsWith(p)) && !isAdmin) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Organizer-only routes
  if (ORGANIZER_PREFIXES.some(p => pathname.startsWith(p)) && !isOrganizer) {
    return NextResponse.redirect(new URL('/account/apply', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/organizer/:path*',
    '/admin/:path*',
    '/inbox/:path*',
    '/account/:path*',
    '/tickets/manage/:path*',
    '/tickets/create/:path*',
    '/tickets/scan/:path*',
    '/tickets/validate/:path*',
    '/tickets/edit/:path*',
    '/layouts/editor/:path*',
    '/layouts/editor',
    '/flow/new',
    '/events/new',
    '/wrapped',
    '/preferences',
  ],
}
