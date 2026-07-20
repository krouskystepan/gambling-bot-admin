export const SETTINGS_CHANGE_SECTIONS = [
  'global',
  'channels',
  'moderation',
  'casino',
  'bonus',
  'vip',
  'reset'
] as const

export type SettingsChangeSection = (typeof SETTINGS_CHANGE_SECTIONS)[number]

export const SETTINGS_CHANGE_SECTION_LABELS: Record<
  SettingsChangeSection,
  string
> = {
  global: 'Global',
  channels: 'Channels',
  moderation: 'Moderation',
  casino: 'Casino',
  bonus: 'Bonuses',
  vip: 'VIP',
  reset: 'Reset'
}

export function isSettingsChangeSection(
  value: string
): value is SettingsChangeSection {
  return (SETTINGS_CHANGE_SECTIONS as readonly string[]).includes(value)
}
