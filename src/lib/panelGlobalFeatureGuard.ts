import {
  type GlobalFeature,
  type GlobalSettings,
  type TGuildConfiguration,
  isGlobalFeatureDisabled,
  normalizeGlobalSettings
} from 'gambling-bot-shared'

export const PANEL_FEATURE_DISABLED_MESSAGES: Record<GlobalFeature, string> = {
  registration: 'New user registration is disabled on this server.',
  deposit: 'Deposits are disabled on this server.',
  withdraw: 'Withdrawals are disabled on this server.',
  casinoGames: 'Casino games are disabled on this server.',
  casinoGamesForMods: 'Mod casino tools are disabled on this server.',
  predictions: 'Prediction betting is disabled on this server.',
  predictionManagement: 'Prediction management is disabled on this server.',
  raffles: 'Raffle ticket purchases are disabled on this server.',
  raffleManagement: 'Raffle management is disabled on this server.',
  dailyBonus: 'The daily bonus is disabled on this server.',
  vip: 'VIP features are disabled on this server.',
  maintenance: 'This server is in maintenance mode.'
}

const guildConfigFromSettings = (
  globalSettings: Partial<GlobalSettings> | null | undefined
): TGuildConfiguration | null => {
  if (!globalSettings) return null
  return {
    globalSettings: normalizeGlobalSettings(globalSettings)
  } as TGuildConfiguration
}

export const isPanelMaintenanceBlocking = (
  globalSettings: Partial<GlobalSettings> | null | undefined,
  isGuildAdmin: boolean
): boolean =>
  !isGuildAdmin &&
  isGlobalFeatureDisabled(
    guildConfigFromSettings(globalSettings),
    'maintenance'
  )

export const isPanelFeatureBlocking = (
  globalSettings: Partial<GlobalSettings> | null | undefined,
  feature: GlobalFeature,
  isGuildAdmin: boolean
): boolean => {
  const config = guildConfigFromSettings(globalSettings)
  if (isPanelMaintenanceBlocking(globalSettings, isGuildAdmin)) return true
  return isGlobalFeatureDisabled(config, feature)
}

export const getPanelFeatureBlockMessage = (
  globalSettings: Partial<GlobalSettings> | null | undefined,
  feature: GlobalFeature,
  isGuildAdmin: boolean
): string | null => {
  const config = guildConfigFromSettings(globalSettings)
  if (isPanelMaintenanceBlocking(globalSettings, isGuildAdmin)) {
    return PANEL_FEATURE_DISABLED_MESSAGES.maintenance
  }
  if (isGlobalFeatureDisabled(config, feature)) {
    return PANEL_FEATURE_DISABLED_MESSAGES[feature]
  }
  return null
}
