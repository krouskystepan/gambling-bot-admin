import type { GlobalFeature } from 'gambling-bot-shared/guild'
import 'server-only'

import type { GuildAccess } from '@/actions/perms'
import { connectToDatabase } from '@/lib/db'
import GuildConfiguration from '@/models/GuildConfiguration'

import {
  PANEL_FEATURE_DISABLED_MESSAGES,
  getPanelFeatureBlockMessage,
  isPanelMaintenanceBlocking
} from './panelGlobalFeatureGuard'

export type PanelActionBlockResult = {
  success: false
  message: string
}

/**
 * Server-side guard for panel mutations tied to Global Settings feature flags.
 * Always check in server actions — UI disables are not sufficient on their own.
 */
export async function blockPanelFeatureAction(
  guildId: string,
  feature: GlobalFeature,
  access: GuildAccess
): Promise<PanelActionBlockResult | null> {
  await connectToDatabase()

  const guildConfig = await GuildConfiguration.findOne({ guildId })
    .select('globalSettings')
    .lean()

  const message = getPanelFeatureBlockMessage(
    guildConfig?.globalSettings,
    feature,
    access.isAdmin
  )

  if (message) return { success: false, message }
  return null
}

/** Blocks non-admin managers during maintenance (admins may still act). */
export async function blockPanelMaintenanceAction(
  guildId: string,
  access: GuildAccess
): Promise<PanelActionBlockResult | null> {
  await connectToDatabase()

  const guildConfig = await GuildConfiguration.findOne({ guildId })
    .select('globalSettings')
    .lean()

  if (isPanelMaintenanceBlocking(guildConfig?.globalSettings, access.isAdmin)) {
    return {
      success: false,
      message: PANEL_FEATURE_DISABLED_MESSAGES.maintenance
    }
  }

  return null
}
