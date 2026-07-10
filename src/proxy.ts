import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getAuthTokenFromRequest, isValidAuthToken } from '@/lib/auth/authToken'

// Kept in sync with PRESENTATION_HEADER in presentationMode.ts (edge runtime
// cannot import that server-only module).
const PRESENTATION_HEADER = 'x-presentation'

/**
 * Clone request headers with the internal presentation flag forced on or off.
 * The client-supplied value is always dropped first so it can never be spoofed.
 */
function withPresentationFlag(request: NextRequest, enabled: boolean): Headers {
  const headers = new Headers(request.headers)
  headers.delete(PRESENTATION_HEADER)
  if (enabled) {
    headers.set(PRESENTATION_HEADER, '1')
  }
  return headers
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The /present tree is the always-on, public read-only demo. No login of any
  // kind (no Discord auth, no password) — anyone with the link can browse it.
  if (pathname === '/present' || pathname.startsWith('/present/')) {
    return NextResponse.next({
      request: { headers: withPresentationFlag(request, true) }
    })
  }

  // Every non-demo route: strip any spoofed presentation flag.
  const sanitized = {
    request: { headers: withPresentationFlag(request, false) }
  }

  // Public landing page.
  if (pathname === '/') {
    return NextResponse.next(sanitized)
  }

  const token = await getAuthTokenFromRequest(request)

  if (!isValidAuthToken(token)) {
    const loginUrl = new URL('/login', request.url)
    const callbackPath = request.nextUrl.pathname + request.nextUrl.search
    loginUrl.searchParams.set('callbackUrl', callbackPath)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next(sanitized)
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/dashboard/:path*',
    '/present',
    '/present/:path*'
  ]
}
