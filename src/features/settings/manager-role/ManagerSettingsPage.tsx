import { getManagerRole } from '@/actions/database/managerRole.action'
import { getGuildRoles } from '@/actions/discord/role.action'
import FeatureLayout from '@/features/FeatureLayout'

import ManagerSettingsForm from './ManagerSettingsForm'

const ManagerSettingsPage = async ({ guildId }: { guildId: string }) => {
  const [roles, config] = await Promise.all([
    getGuildRoles(guildId),
    getManagerRole(guildId)
  ])

  return (
    <FeatureLayout title="Manager Settings">
      <ManagerSettingsForm
        guildId={guildId}
        roles={roles}
        savedRoleId={config?.managerRoleId ?? ''}
      />
    </FeatureLayout>
  )
}

export default ManagerSettingsPage
