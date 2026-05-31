import { getToken } from 'next-auth/jwt'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  if (!token?.accessToken || token.error) {
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
