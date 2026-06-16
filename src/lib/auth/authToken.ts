import { getToken } from 'next-auth/jwt'
import type { JWT } from 'next-auth/jwt'

import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'

export function isValidAuthToken(token: JWT | null): boolean {
  return Boolean(token?.accessToken && !token.error)
}

/** Keep in sync with next-auth/jwt getToken() default secureCookie logic. */
function usesSecureCookies(): boolean {
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? ''
  if (nextAuthUrl.startsWith('https://')) {
    return true
  }
  return Boolean(process.env.VERCEL)
}

export async function getAuthTokenFromRequest(
  request: NextRequest
): Promise<JWT | null> {
  return getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: usesSecureCookies()
  })
}

export async function getAuthToken(): Promise<JWT | null> {
  const cookieStore = await cookies()
  const headersList = await headers()

  return getToken({
    req: {
      headers: headersList,
      cookies: cookieStore
    } as unknown as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: usesSecureCookies()
  })
}
