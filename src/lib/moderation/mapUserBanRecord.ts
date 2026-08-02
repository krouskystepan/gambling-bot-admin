import type { UserProfileBanRecord } from '@/actions/database/userProfile.action'

type BanDocLike = {
  banId: string
  bannedAt: Date
  bannedBy: string
  banReason?: string | null
  unbannedAt?: Date | null
  unbannedBy?: string | null
  unbanReason?: string | null
}

export function mapUserBanRecord(
  ban: BanDocLike,
  resolveUsername: (id: string | null | undefined) => string | undefined
): UserProfileBanRecord {
  return {
    banId: ban.banId,
    bannedAt: ban.bannedAt,
    bannedBy: ban.bannedBy,
    bannedByUsername: resolveUsername(ban.bannedBy),
    banReason: ban.banReason ?? undefined,
    unbannedAt: ban.unbannedAt ?? null,
    unbannedBy: ban.unbannedBy ?? null,
    unbannedByUsername: resolveUsername(ban.unbannedBy),
    unbanReason: ban.unbanReason ?? undefined
  }
}
