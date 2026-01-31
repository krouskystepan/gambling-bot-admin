import { getBonusSettings } from '@/actions/database/bonusSettings.action'
import FeatureLayout from '@/features/FeatureLayout'

import BonuseSettingsForm from './BonusesSettingsForm'

const BonusesSettingsPage = async ({ guildId }: { guildId: string }) => {
  const settings = await getBonusSettings(guildId)

  return (
    <FeatureLayout title="Bonus Settings">
      <BonuseSettingsForm
        guildId={guildId}
        savedSettings={
          settings ?? {
            rewardMode: 'linear',
            baseReward: 0,
            streakIncrement: 0,
            streakMultiplier: 1,
            maxReward: 0,
            resetOnMax: false,
            milestoneBonus: {
              weekly: 0,
              monthly: 0
            }
          }
        }
      />
    </FeatureLayout>
  )
}

export default BonusesSettingsPage
