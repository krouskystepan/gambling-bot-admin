import {
  type GlobalSettings,
  normalizeGlobalSettings
} from 'gambling-bot-shared/guild'

export const DEMO_GUILD_NAME = 'Demo Guild'
export const DEMO_TIMEZONE = 'Europe/Prague'
export const DEFAULT_DEMO_AVATAR = '/default-avatar.jpg'

export type DemoMember = {
  userId: string
  username: string
  nickname: string | null
  avatar: string
  /** Staff members can appear as `handledBy` on transactions / audit logs. */
  staff?: boolean
}

/**
 * Stable roster shared across every fixture so users, transactions, overview
 * leaderboards, ATM requests, etc. all reference the same cast of characters.
 */
export const DEMO_MEMBERS: DemoMember[] = [
  {
    userId: '100000000000000001',
    username: 'nova',
    nickname: 'Nova',
    avatar: DEFAULT_DEMO_AVATAR,
    staff: true
  },
  {
    userId: '100000000000000002',
    username: 'kaito',
    nickname: 'Kaito',
    avatar: DEFAULT_DEMO_AVATAR,
    staff: true
  },
  {
    userId: '100000000000000003',
    username: 'mira',
    nickname: 'Mira',
    avatar: DEFAULT_DEMO_AVATAR,
    staff: true
  },
  {
    userId: '100000000000000004',
    username: 'lucaz',
    nickname: 'Luca',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000005',
    username: 'sienna',
    nickname: 'Sienna',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000006',
    username: 'orion',
    nickname: 'Orion',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000007',
    username: 'petra',
    nickname: 'Petra',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000008',
    username: 'devan',
    nickname: 'Devan',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000009',
    username: 'yuki',
    nickname: 'Yuki',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000010',
    username: 'marco',
    nickname: 'Marco',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000011',
    username: 'freya',
    nickname: 'Freya',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000012',
    username: 'idris',
    nickname: 'Idris',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000013',
    username: 'talia',
    nickname: 'Talia',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000014',
    username: 'bruno',
    nickname: 'Bruno',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000015',
    username: 'elle',
    nickname: 'Elle',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000016',
    username: 'zane',
    nickname: 'Zane',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000017',
    username: 'noor',
    nickname: 'Noor',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000018',
    username: 'pavel',
    nickname: 'Pavel',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000019',
    username: 'greta',
    nickname: 'Greta',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000020',
    username: 'hassan',
    nickname: 'Hassan',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000021',
    username: 'ines',
    nickname: 'Inès',
    avatar: DEFAULT_DEMO_AVATAR
  },
  {
    userId: '100000000000000022',
    username: 'dominik',
    nickname: 'Dominik',
    avatar: DEFAULT_DEMO_AVATAR
  }
]

export const DEMO_STAFF_MEMBERS = DEMO_MEMBERS.filter((m) => m.staff)

const memberById = new Map(DEMO_MEMBERS.map((m) => [m.userId, m]))

export function getDemoMember(userId: string): DemoMember | undefined {
  return memberById.get(userId)
}

export function getDemoUsername(userId: string): string {
  return memberById.get(userId)?.username ?? 'unknown'
}

export function getDemoNickname(userId: string): string | null {
  return memberById.get(userId)?.nickname ?? null
}

export function getDemoAvatar(userId: string): string {
  return memberById.get(userId)?.avatar ?? DEFAULT_DEMO_AVATAR
}

export const demoGlobalSettings: GlobalSettings = normalizeGlobalSettings({
  disableRegistrations: false,
  disableDeposits: false,
  disableWithdrawals: false,
  disableCasinoGames: false,
  disableCasinoGamesForMods: false,
  disablePredictions: false,
  disablePredictionManagement: false,
  disableRaffles: false,
  disableRaffleManagement: false,
  disableDailyBonus: false,
  disableVip: false,
  maintenanceMode: false,
  timezone: DEMO_TIMEZONE,
  currencySymbol: '$',
  currencyPlacement: 'prefix'
})

/** Discord member list shape returned by `getDiscordGuildMembers`. */
export type DemoDiscordMember = {
  userId: string
  username: string
  nickname: string | null
  avatarUrl: string
}

export function getDemoDiscordMembers(): DemoDiscordMember[] {
  return DEMO_MEMBERS.map((m) => ({
    userId: m.userId,
    username: m.username,
    nickname: m.nickname,
    avatarUrl: m.avatar
  }))
}

export function getDemoStaffMembers(): { userId: string; username: string }[] {
  return DEMO_STAFF_MEMBERS.map((m) => ({
    userId: m.userId,
    username: m.username
  })).sort((a, b) => a.username.localeCompare(b.username))
}
