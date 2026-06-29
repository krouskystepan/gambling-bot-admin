import { getModerationSettings } from '@/actions/database/moderationSettings.action'
import { getGuildRoles } from '@/actions/discord/role.action'
import FeatureLayout from '@/features/FeatureLayout'

import ModerationSettingsForm from './ModerationSettingsForm'

const ModerationSettingsPage = async ({ guildId }: { guildId: string }) => {
  const [roles, config] = await Promise.all([
    getGuildRoles(guildId),
    getModerationSettings(guildId)
  ])

  return (
    <FeatureLayout title="Moderation Settings">
      <ModerationSettingsForm
        guildId={guildId}
        roles={roles}
        savedRoleId={config?.managerRoleId ?? ''}
        savedBannedRoleId={config?.bannedRoleId ?? ''}
      />
    </FeatureLayout>
  )
}

export default ModerationSettingsPage
