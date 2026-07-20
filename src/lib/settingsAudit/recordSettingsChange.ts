import SettingsChangeLog from '@/models/SettingsChangeLog'

import { diffSettingsPaths } from './diffSettingsPaths'
import type { SettingsChangeSection } from './settingsChangeSections'

export type RecordSettingsChangeInput = {
  guildId: string
  changedBy: string
  section: SettingsChangeSection
  before: unknown
  after: unknown
}

/** Strip mongoose/Date quirks into a JSON-stable plain value. */
export function toPlainSettingsValue(value: unknown): unknown {
  if (value === undefined) return null
  return JSON.parse(JSON.stringify(value))
}

export async function recordSettingsChange({
  guildId,
  changedBy,
  section,
  before,
  after
}: RecordSettingsChangeInput) {
  const beforePlain = toPlainSettingsValue(before)
  const afterPlain = toPlainSettingsValue(after)

  if (JSON.stringify(beforePlain) === JSON.stringify(afterPlain)) {
    return null
  }

  const changedPaths = diffSettingsPaths(beforePlain, afterPlain).filter(
    (path) => path.length > 0
  )

  return SettingsChangeLog.create({
    guildId,
    changedBy,
    section,
    before: beforePlain,
    after: afterPlain,
    changedPaths
  })
}
