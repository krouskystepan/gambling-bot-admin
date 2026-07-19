import { useSyncExternalStore } from 'react'

import { GUILD_CONFIG_SIDEBAR_LINKS } from '@/components/shell/guild-config/guildConfigSidebarLinks'

const STORAGE_KEY = 'admin-profile-preferences'

export const PROFILE_THEME_OPTIONS = ['light', 'dark', 'system'] as const
export type ProfileTheme = (typeof PROFILE_THEME_OPTIONS)[number]

export const TABLE_DENSITY_OPTIONS = ['comfortable', 'compact'] as const
export type TableDensity = (typeof TABLE_DENSITY_OPTIONS)[number]

export const TOAST_POSITION_OPTIONS = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right'
] as const
export type ToastPosition = (typeof TOAST_POSITION_OPTIONS)[number]

export const TOAST_POSITION_LABELS: Record<ToastPosition, string> = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  'bottom-left': 'Bottom left',
  'bottom-right': 'Bottom right'
}

export const LANDING_SECTION_OPTIONS = GUILD_CONFIG_SIDEBAR_LINKS.filter(
  (group) => group.value !== 'dev'
).flatMap((group) =>
  group.links.map((link) => ({
    id: link.id,
    label: link.label
  }))
)

export type LandingSectionId = (typeof LANDING_SECTION_OPTIONS)[number]['id']

const LANDING_SECTION_IDS = new Set<string>(
  LANDING_SECTION_OPTIONS.map((option) => option.id)
)

export type ProfilePreferences = {
  theme: ProfileTheme
  tableDensity: TableDensity
  landingSection: LandingSectionId
  reduceMotion: boolean
  richToasts: boolean
  toastPosition: ToastPosition
}

export const DEFAULT_PROFILE_PREFERENCES: ProfilePreferences = {
  theme: 'system',
  tableDensity: 'comfortable',
  landingSection: 'overview',
  reduceMotion: false,
  richToasts: true,
  toastPosition: 'bottom-right'
}

type PreferencesListener = () => void

let listeners: PreferencesListener[] = []
let cachedSnapshot: ProfilePreferences = DEFAULT_PROFILE_PREFERENCES
let cachedSerialized = JSON.stringify(DEFAULT_PROFILE_PREFERENCES)

const isProfileTheme = (value: unknown): value is ProfileTheme =>
  typeof value === 'string' &&
  (PROFILE_THEME_OPTIONS as readonly string[]).includes(value)

const isTableDensity = (value: unknown): value is TableDensity =>
  typeof value === 'string' &&
  (TABLE_DENSITY_OPTIONS as readonly string[]).includes(value)

const isLandingSectionId = (value: unknown): value is LandingSectionId =>
  typeof value === 'string' && LANDING_SECTION_IDS.has(value)

const isToastPosition = (value: unknown): value is ToastPosition =>
  typeof value === 'string' &&
  (TOAST_POSITION_OPTIONS as readonly string[]).includes(value)

const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean'

const normalizePreferences = (value: unknown): ProfilePreferences => {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_PROFILE_PREFERENCES }
  }

  const record = value as Record<string, unknown>

  return {
    theme: isProfileTheme(record.theme)
      ? record.theme
      : DEFAULT_PROFILE_PREFERENCES.theme,
    tableDensity: isTableDensity(record.tableDensity)
      ? record.tableDensity
      : DEFAULT_PROFILE_PREFERENCES.tableDensity,
    landingSection: isLandingSectionId(record.landingSection)
      ? record.landingSection
      : DEFAULT_PROFILE_PREFERENCES.landingSection,
    reduceMotion: isBoolean(record.reduceMotion)
      ? record.reduceMotion
      : DEFAULT_PROFILE_PREFERENCES.reduceMotion,
    richToasts: isBoolean(record.richToasts)
      ? record.richToasts
      : DEFAULT_PROFILE_PREFERENCES.richToasts,
    toastPosition: isToastPosition(record.toastPosition)
      ? record.toastPosition
      : DEFAULT_PROFILE_PREFERENCES.toastPosition
  }
}

const readStoredPreferences = (): ProfilePreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROFILE_PREFERENCES }

    return normalizePreferences(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_PROFILE_PREFERENCES }
  }
}

const refreshCachedSnapshot = (prefs: ProfilePreferences) => {
  const serialized = JSON.stringify(prefs)
  if (serialized === cachedSerialized) {
    return cachedSnapshot
  }

  cachedSerialized = serialized
  cachedSnapshot = prefs
  return cachedSnapshot
}

export const subscribeToProfilePreferences = (
  listener: PreferencesListener
) => {
  listeners = [...listeners, listener]

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener()
    }
  }

  window.addEventListener('storage', onStorage)

  return () => {
    listeners = listeners.filter((item) => item !== listener)
    window.removeEventListener('storage', onStorage)
  }
}

const notifyPreferencesChange = () => {
  listeners.forEach((listener) => listener())
}

export const getProfilePreferencesSnapshot = () =>
  refreshCachedSnapshot(readStoredPreferences())

export const getProfilePreferencesServerSnapshot = () =>
  refreshCachedSnapshot({ ...DEFAULT_PROFILE_PREFERENCES })

export const persistProfilePreferences = (
  patch: Partial<ProfilePreferences>
) => {
  const next = normalizePreferences({
    ...readStoredPreferences(),
    ...patch
  })

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore quota or private-mode storage errors.
  }

  refreshCachedSnapshot(next)
  notifyPreferencesChange()
}

export const useProfilePreferences = () => {
  const preferences = useSyncExternalStore(
    subscribeToProfilePreferences,
    getProfilePreferencesSnapshot,
    getProfilePreferencesServerSnapshot
  )

  return {
    preferences,
    persist: persistProfilePreferences
  }
}
