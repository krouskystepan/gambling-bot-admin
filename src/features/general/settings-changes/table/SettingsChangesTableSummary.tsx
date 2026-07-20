import type { SettingsChangeCounts } from '@/actions/database/settingsChanges.action'
import KpiStrip from '@/components/page/KpiStrip'
import { SETTINGS_CHANGE_SECTION_LABELS } from '@/lib/settingsAudit/settingsChangeSections'

const SettingsChangesTableSummary = ({
  counts
}: {
  counts: SettingsChangeCounts
}) => {
  return (
    <KpiStrip
      items={[
        { label: SETTINGS_CHANGE_SECTION_LABELS.global, value: counts.global },
        {
          label: SETTINGS_CHANGE_SECTION_LABELS.channels,
          value: counts.channels
        },
        {
          label: SETTINGS_CHANGE_SECTION_LABELS.moderation,
          value: counts.moderation
        },
        { label: SETTINGS_CHANGE_SECTION_LABELS.casino, value: counts.casino },
        { label: SETTINGS_CHANGE_SECTION_LABELS.bonus, value: counts.bonus },
        { label: SETTINGS_CHANGE_SECTION_LABELS.vip, value: counts.vip },
        { label: SETTINGS_CHANGE_SECTION_LABELS.reset, value: counts.reset }
      ]}
    />
  )
}

export default SettingsChangesTableSummary
