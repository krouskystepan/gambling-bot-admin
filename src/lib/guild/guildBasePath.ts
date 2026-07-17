import { DEMO_GUILD_ID } from '@/lib/presentation/constants'

/**
 * Root path for every link inside a guild's admin area.
 *
 * The always-on read-only demo is served from `/present`, while real guilds live
 * under `/dashboard/g/<id>`. All in-app links must build on top of this so demo
 * visitors are never bounced to the authenticated dashboard (which would force a
 * login) when they click a health card, username, etc.
 */
export function guildBasePath(guildId: string): string {
  return guildId === DEMO_GUILD_ID ? '/present' : `/dashboard/g/${guildId}`
}
