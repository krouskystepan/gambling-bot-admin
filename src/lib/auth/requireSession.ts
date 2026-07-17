import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'

import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth/authOptions'
import { getAuthToken, isValidAuthToken } from '@/lib/auth/authToken'
import {
  getPresentationSession,
  isPresentationRequest
} from '@/lib/presentation'

function isValidSession(session: Session | null): session is Session {
  return Boolean(session?.accessToken && !session.error)
}

async function hasValidAuth(): Promise<boolean> {
  const token = await getAuthToken()
  if (!isValidAuthToken(token)) {
    return false
  }

  const session = await getServerSession(authOptions)
  return isValidSession(session)
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
  if (await isPresentationRequest()) {
    return getPresentationSession()
  }

  if (!(await hasValidAuth())) {
    return null
  }

  const session = await getServerSession(authOptions)
  if (!isValidSession(session)) {
    return null
  }
  return session
}

export async function requireSession(): Promise<Session> {
  if (await isPresentationRequest()) {
    return getPresentationSession()
  }

  if (!(await hasValidAuth())) {
    redirect('/login')
  }

  const session = await getServerSession(authOptions)
  if (!isValidSession(session)) {
    redirect('/login')
  }
  return session
}
