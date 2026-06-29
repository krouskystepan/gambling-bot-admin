import { normalizeBonusSettings } from 'gambling-bot-shared/bonus'
import {
  defaultCasinoSettings,
  normalizeCasinoSettings
} from 'gambling-bot-shared/casino'
import { normalizeGlobalSettings } from 'gambling-bot-shared/guild'

import FeatureLayout from '@/features/FeatureLayout'
import { connectToDatabase } from '@/lib/db'
import GuildConfiguration from '@/models/GuildConfiguration'

import DevBonusSimLab from './components/DevBonusSimLab'
import DevCasinoSimLab from './components/DevCasinoSimLab'
import DevSectionHeading from './components/DevSectionHeading'
import { requireDevPage } from './requireDevPage'

const DEFAULT_BONUS_SETTINGS = normalizeBonusSettings({
  rewardMode: 'linear',
  baseReward: 0,
  streakIncrement: 0,
  streakMultiplier: 1,
  maxReward: 0,
  resetOnMax: false,
  milestoneBonus: { weekly: 0, monthly: 0 }
})

const DevCalcsPage = async ({ guildId }: { guildId: string }) => {
  await requireDevPage(guildId)

  await connectToDatabase()
  const config = await GuildConfiguration.findOne({ guildId }).lean()

  const casinoSettings = normalizeCasinoSettings(
    config?.casinoSettings ?? defaultCasinoSettings
  )
  const bonusSettings = normalizeBonusSettings(
    (config?.bonusSettings as typeof DEFAULT_BONUS_SETTINGS | undefined) ??
      DEFAULT_BONUS_SETTINGS
  )
  const globalSettings = normalizeGlobalSettings(
    (config?.globalSettings as Parameters<typeof normalizeGlobalSettings>[0]) ??
      {}
  )

  return (
    <FeatureLayout title="Simulations">
      <div className="space-y-8">
        <section className="space-y-4">
          <DevSectionHeading
            title="Casino"
            description="Validate analytical RTP against Monte Carlo rolls using live guild settings."
          />
          <DevCasinoSimLab casinoSettings={casinoSettings} />
        </section>

        <section className="space-y-4">
          <DevSectionHeading
            title="Bonuses"
            description="Stress-test streak rewards, milestones, and cap-reset cycles."
          />
          <DevBonusSimLab
            bonusSettings={bonusSettings}
            globalSettings={globalSettings}
          />
        </section>
      </div>
    </FeatureLayout>
  )
}

export default DevCalcsPage
