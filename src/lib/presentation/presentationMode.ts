import 'server-only'

import { headers } from 'next/headers'

import {
  DEMO_GUILD_ID,
  PRESENTATION_HEADER,
  PRESENTATION_USER_ID
} from './constants'

/**
 * The read-only presentation ("demo") experience is NOT a separate deploy — it
 * lives permanently at `/present/*` inside the normal app. Two independent
 * signals drive it:
 *
 *  1. {@link DEMO_GUILD_ID} — every `/present/*` page renders this sentinel
 *     guild, and read/write server actions branch on {@link isDemoGuild}. Real
 *     guilds can never equal the sentinel, so production data paths are
 *     untouched even though the code ships in the same bundle.
 *  2. The `x-presentation` request header — set by the edge proxy for
 *     `/present/*` only (and stripped everywhere else). This lets
 *     `requireSession` hand back a synthetic viewer session without Discord
 *     auth. See {@link isPresentationRequest}.
 */
export { DEMO_GUILD_ID, PRESENTATION_HEADER, PRESENTATION_USER_ID }

/**
 * True when the current request is being served under the always-on `/present`
 * route tree (the proxy set the internal header). Only meaningful for
 * `requireSession`; data access keys off {@link isDemoGuild} instead.
 */
export async function isPresentationRequest(): Promise<boolean> {
  const store = await headers()
  return store.get(PRESENTATION_HEADER) === '1'
}

/**
 * True when the given guild id is the demo sentinel and should be served from
 * static fixtures (reads) or blocked (writes). This is the single switch for all
 * demo data behaviour and is safe in production because no real guild uses the
 * sentinel id.
 */
export function isDemoGuild(guildId: string): boolean {
  return guildId === DEMO_GUILD_ID
}
