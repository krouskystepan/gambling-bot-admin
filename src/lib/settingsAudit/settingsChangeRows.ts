import {
  SETTINGS_CHANGE_SECTIONS,
  type SettingsChangeSection
} from '@/lib/settingsAudit/settingsChangeSections'

export type SettingsChangeRow = {
  id: string
  occurredAt: Date
  changedBy: string
  changedByUsername: string | null
  section: SettingsChangeSection
  sectionLabel: string
  changedPaths: string[]
  summary: string
  before: unknown
  after: unknown
}

export type SettingsChangeCounts = Record<SettingsChangeSection, number>

export type SettingsChangeEntityFacets = {
  staff: Record<string, number>
}

export type SettingsChangesFilters = {
  staffId?: string
  filterSection?: SettingsChangeSection[]
  dateFrom?: string
  dateTo?: string
}

export function emptySettingsChangeCounts(): SettingsChangeCounts {
  return Object.fromEntries(
    SETTINGS_CHANGE_SECTIONS.map((section) => [section, 0])
  ) as SettingsChangeCounts
}

export function formatSettingsChangeSummary(changedPaths: string[]): string {
  if (changedPaths.length === 0) return 'No field changes'
  if (changedPaths.length === 1) return changedPaths[0]
  if (changedPaths.length <= 3) return changedPaths.join(', ')
  return `${changedPaths.length} fields changed`
}
