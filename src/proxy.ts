import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PROTECTED_PREFIXES = [
  '/events/new',
  '/flow/new',
  '/inbox',
  '/profile/edit',
  '/tickets',
  '/organizer',
  '/admin',
  '/preferences',
  '/layouts',
  '/wrapped',
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && !req.auth?.user?.roles?.includes('Admin')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
