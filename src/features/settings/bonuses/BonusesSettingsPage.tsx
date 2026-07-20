import { getBonusSettings } from '@/actions/database/bonusSettings.action'
import FeatureLayout from '@/features/FeatureLayout'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'

import BonuseSettingsForm from './BonusesSettingsForm'

const BonusesSettingsPage = async ({ guildId }: { guildId: string }) => {
  const [settings, globalSettings] = await Promise.all([
    getBonusSettings(guildId),
    getGuildGlobalSettings(guildId)
  ])

  return (
    <FeatureLayout
      title="Bonus Settings"
      description="Daily/weekly and other bonus configuration"
    >
      <BonuseSettingsForm
        guildId={guildId}
        globalSettings={globalSettings}
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
