// page.tsx (SERVER)
import { getVipSettings } from '@/actions/database/vipSettings.action'
import { getGuildCategories } from '@/actions/discord/category.action'
import { getGuildRoles } from '@/actions/discord/role.action'
import FeatureLayout from '@/features/FeatureLayout'

import VipSettingsForm from './VipSettingsForm'

const VipSettingsPage = async ({ guildId }: { guildId: string }) => {
  const [roles, categories, vipSettings] = await Promise.all([
    getGuildRoles(guildId),
    getGuildCategories(guildId),
    getVipSettings(guildId)
  ])

  return (
    <FeatureLayout title="VIP Settings">
      <VipSettingsForm
        guildId={guildId}
        roles={roles}
        categories={categories}
        savedSettings={{
          roleOwnerId: vipSettings?.roleOwnerId ?? '',
          roleMemberId: vipSettings?.roleMemberId ?? '',
          categoryId: vipSettings?.categoryId ?? '',
          pricePerDay: vipSettings?.pricePerDay ?? 0,
          pricePerCreate: vipSettings?.pricePerCreate ?? 0,
          pricePerAdditionalMember: vipSettings?.pricePerAdditionalMember ?? 0,
          maxMembers: vipSettings?.maxMembers ?? 0
        }}
      />
    </FeatureLayout>
  )
}

export default VipSettingsPage
