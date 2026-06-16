import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getAuthTokenFromRequest, isValidAuthToken } from '@/lib/auth/authToken'

export async function proxy(request: NextRequest) {
  const token = await getAuthTokenFromRequest(request)

  if (!isValidAuthToken(token)) {
    const loginUrl = new URL('/login', request.url)
    const callbackPath = request.nextUrl.pathname + request.nextUrl.search
    loginUrl.searchParams.set('callbackUrl', callbackPath)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*']
}
