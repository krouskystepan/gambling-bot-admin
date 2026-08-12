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

function demoAvatar(gender: 'men' | 'women', index: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`
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
    avatar: demoAvatar('women', 1),
    staff: true
  },
  {
    userId: '100000000000000002',
    username: 'kaito',
    nickname: 'Kaito',
    avatar: demoAvatar('men', 2),
    staff: true
  },
  {
    userId: '100000000000000003',
    username: 'mira',
    nickname: 'Mira',
    avatar: demoAvatar('women', 3),
    staff: true
  },
  {
    userId: '100000000000000004',
    username: 'lucaz',
    nickname: 'Luca',
    avatar: demoAvatar('men', 4)
  },
  {
    userId: '100000000000000005',
    username: 'sienna',
    nickname: 'Sienna',
    avatar: demoAvatar('women', 5)
  },
  {
    userId: '100000000000000006',
    username: 'orion',
    nickname: 'Orion',
    avatar: demoAvatar('men', 6)
  },
  {
    userId: '100000000000000007',
    username: 'petra',
    nickname: 'Petra',
    avatar: demoAvatar('women', 7)
  },
  {
    userId: '100000000000000008',
    username: 'devan',
    nickname: 'Devan',
    avatar: demoAvatar('men', 8)
  },
  {
    userId: '100000000000000009',
    username: 'yuki',
    nickname: 'Yuki',
    avatar: demoAvatar('women', 9)
  },
  {
    userId: '100000000000000010',
    username: 'marco',
    nickname: 'Marco',
    avatar: demoAvatar('men', 10)
  },
  {
    userId: '100000000000000011',
    username: 'freya',
    nickname: 'Freya',
    avatar: demoAvatar('women', 11)
  },
  {
    userId: '100000000000000012',
    username: 'idris',
    nickname: 'Idris',
    avatar: demoAvatar('men', 12)
  },
  {
    userId: '100000000000000013',
    username: 'talia',
    nickname: 'Talia',
    avatar: demoAvatar('women', 13)
  },
  {
    userId: '100000000000000014',
    username: 'bruno',
    nickname: 'Bruno',
    avatar: demoAvatar('men', 14)
  },
  {
    userId: '100000000000000015',
    username: 'elle',
    nickname: 'Elle',
    avatar: demoAvatar('women', 15)
  },
  {
    userId: '100000000000000016',
    username: 'zane',
    nickname: 'Zane',
    avatar: demoAvatar('men', 16)
  },
  {
    userId: '100000000000000017',
    username: 'noor',
    nickname: 'Noor',
    avatar: demoAvatar('women', 17)
  },
  {
    userId: '100000000000000018',
    username: 'pavel',
    nickname: 'Pavel',
    avatar: demoAvatar('men', 18)
  },
  {
    userId: '100000000000000019',
    username: 'greta',
    nickname: 'Greta',
    avatar: demoAvatar('women', 19)
  },
  {
    userId: '100000000000000020',
    username: 'hassan',
    nickname: 'Hassan',
    avatar: demoAvatar('men', 20)
  },
  {
    userId: '100000000000000021',
    username: 'ines',
    nickname: 'Inès',
    avatar: demoAvatar('women', 21)
  },
  {
    userId: '100000000000000022',
    username: 'dominik',
    nickname: 'Dominik',
    avatar: demoAvatar('men', 22)
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
  disablePeerTransfers: false,
  disableCasinoGames: false,
  disableCasinoGamesForMods: false,
  disablePredictionManagement: false,
  disableRaffleManagement: false,
  disableDailyBonus: false,
  disableVip: false,
  disableQuests: false,
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
