import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/authOptions'

function isValidSession(session: Session | null): session is Session {
  return Boolean(session?.accessToken && !session.error)
}

export function safeCallbackUrl(
  url: string | undefined,
  fallback = '/dashboard'
): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) {
    return fallback
  }
  return url
}

export async function getSessionOrNull(): Promise<Session | null> {
  const session = await getServerSession(authOptions)
  if (!isValidSession(session)) {
    return null
  }
  return session
}

export async function requireSession(): Promise<Session> {
  const session = await getServerSession(authOptions)
  if (!isValidSession(session)) {
    redirect('/login')
  }
  return session
}
