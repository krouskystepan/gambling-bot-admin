import {
  guildCalendarRangeToUtc,
  resolveGuildTimezone
} from 'gambling-bot-shared'
import { DateTime } from 'luxon'

export { resolveGuildTimezone }

export function guildDateRangeMatch(
  guildId: string,
  dateFrom: string,
  dateTo: string,
  timezone?: string | null
): { guildId: string; createdAt: { $gte: Date; $lte: Date } } {
  const { start, end } = guildCalendarRangeToUtc(dateFrom, dateTo, timezone)
  return { guildId, createdAt: { $gte: start, $lte: end } }
}

export function nowInGuildTimezone(timezone?: string | null): DateTime {
  return DateTime.now().setZone(resolveGuildTimezone(timezone))
}
