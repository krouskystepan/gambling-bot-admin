import type { SectionId } from '@/app/dashboard/g/[guildId]/[sectionId]/sections'

const SETTINGS_SECTION_IDS = new Set<SectionId>([
  'global-settings',
  'channel-settings',
  'casino-settings',
  'moderation-settings',
  'bonus-settings',
  'vip-settings',
  'settings-changes'
])

const DEV_SECTION_IDS = new Set<SectionId>([
  'dev',
  'dev-system',
  'dev-guild',
  'dev-calcs',
  'dev-ui',
  'dev-data'
])

type GuildAccess = {
  isAdmin: boolean
  isManager: boolean
  isDev: boolean
}

export function canAccessSection(
  sectionId: SectionId,
  access: GuildAccess
): boolean {
  if (DEV_SECTION_IDS.has(sectionId)) {
    return access.isDev
  }

  if (SETTINGS_SECTION_IDS.has(sectionId)) {
    return access.isAdmin
  }

  return access.isAdmin || access.isManager
}
