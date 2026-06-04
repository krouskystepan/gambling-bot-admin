import type { SectionId } from '@/app/dashboard/g/[guildId]/[sectionId]/sections'

const SETTINGS_SECTION_IDS = new Set<SectionId>([
  'global-settings',
  'channel-settings',
  'casino-settings',
  'manager-settings',
  'bonus-settings',
  'vip-settings'
])

type GuildAccess = {
  isAdmin: boolean
  isManager: boolean
}

export function canAccessSection(
  sectionId: SectionId,
  access: GuildAccess
): boolean {
  if (SETTINGS_SECTION_IDS.has(sectionId)) {
    return access.isAdmin
  }
  return access.isAdmin || access.isManager
}
