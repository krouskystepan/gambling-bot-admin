import { NextRequest, NextResponse } from 'next/server'

function clearAuthCookies(response: NextResponse, request: NextRequest): void {
  for (const cookie of request.cookies.getAll()) {
    const { name } = cookie
    if (
      name.startsWith('next-auth.') ||
      name.startsWith('__Secure-next-auth.')
    ) {
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
        httpOnly: true,
        sameSite: 'lax'
      })
    }
  }
}

export async function GET(request: NextRequest) {
  const rawCallback =
    request.nextUrl.searchParams.get('callbackUrl') ?? '/login'
  const callbackUrl =
    rawCallback.startsWith('/') && !rawCallback.startsWith('//')
      ? rawCallback
      : '/login'

  const response = NextResponse.redirect(new URL(callbackUrl, request.url))
  clearAuthCookies(response, request)
  return response
}
