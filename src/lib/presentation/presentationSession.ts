import type { Session } from 'next-auth'
import 'server-only'

import { PRESENTATION_USER_ID } from '@/lib/presentation/presentationMode'

/**
 * A fully synthetic session used to satisfy `requireSession()` inside reused
 * feature pages while running the presentation deploy. It carries no real
 * Discord access token — every write path is additionally blocked by
 * `rejectDemoMutation()` and reads are served from fixtures.
 */
export function getPresentationSession(): Session {
  return {
    user: {
      name: 'Demo Viewer',
      image: null,
      email: null
    },
    accessToken: 'presentation',
    userId: PRESENTATION_USER_ID,
    error: null,
    expires: '2999-01-01T00:00:00.000Z'
  }
}
