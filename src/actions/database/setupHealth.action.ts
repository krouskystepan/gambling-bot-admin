'use server'

import {
  calculateRTP,
  defaultCasinoSettings,
  readableGameNames
} from 'gambling-bot-shared/casino'
import { getReadableName } from 'gambling-bot-shared/common'
import { type TGuildConfiguration } from 'gambling-bot-shared/guild'

import { connectToDatabase } from '@/lib/db'
import { getRtpStatus, skipsCasinoRtpCheck } from '@/lib/overview/rtpWarnings'
import GuildConfiguration from '@/models/GuildConfiguration'

export type SetupHealthCheck = {
  id: string
  label: string
  ok: boolean
  href?: string
  warning?: boolean
  rtpStatus?: 'high' | 'low'
}

function buildSetupHealth(
  guildId: string,
  config: TGuildConfiguration | null
): SetupHealthCheck[] {
  const settingsBase = `/dashboard/g/${guildId}`
  const checks: SetupHealthCheck[] = [
    {
      id: 'atm-actions',
      label: 'ATM actions channel',
      ok: Boolean(config?.atmChannelIds?.actions),
      href: `${settingsBase}/channel-settings`
    },
    {
      id: 'atm-logs',
      label: 'ATM logs channel',
      ok: Boolean(config?.atmChannelIds?.logs),
      href: `${settingsBase}/channel-settings`
    },
    {
      id: 'manager-role',
      label: 'Manager role',
      ok: Boolean(config?.managerRoleId),
      href: `${settingsBase}/moderation-settings`
    },
    {
      id: 'casino-channels',
      label: 'Casino channels',
      ok: (config?.casinoChannelIds?.length ?? 0) > 0,
      href: `${settingsBase}/channel-settings`
    },
    {
      id: 'vip-owner-role',
      label: 'VIP owner role',
      ok: Boolean(config?.vipSettings?.roleOwnerId),
      href: `${settingsBase}/vip-settings`
    },
    {
      id: 'vip-member-role',
      label: 'VIP member role',
      ok: Boolean(config?.vipSettings?.roleMemberId),
      href: `${settingsBase}/vip-settings`
    },
    {
      id: 'vip-category',
      label: 'VIP category',
      ok: Boolean(config?.vipSettings?.categoryId),
      href: `${settingsBase}/vip-settings`
    }
  ]

  const casinoSettings = config?.casinoSettings ?? defaultCasinoSettings
  const games = Object.keys(casinoSettings) as Array<
    keyof typeof defaultCasinoSettings
  >

  for (const game of games) {
    if (skipsCasinoRtpCheck(game)) continue

    const settings = casinoSettings[game]
    if (!settings) continue

    const rtp = calculateRTP(
      game,
      settings as (typeof defaultCasinoSettings)[typeof game]
    )

    const status = getRtpStatus(rtp, false)
    if (status !== 'high' && status !== 'low') continue

    const rtpLabel =
      typeof rtp === 'number'
        ? `${rtp.toFixed(1)}%`
        : Object.entries(rtp)
            .map(([k, v]) => `${k}: ${v.toFixed(1)}%`)
            .join(', ')

    checks.push({
      id: `rtp-${game}`,
      label: `${getReadableName(game, readableGameNames)} RTP out of range (${rtpLabel})`,
      ok: false,
      warning: true,
      rtpStatus: status,
      href: `${settingsBase}/casino-settings`
    })
  }

  return checks
}

const countSetupHealthIssues = (checks: SetupHealthCheck[]) =>
  checks.filter((check) => !check.ok).length

export const getSetupHealthChecks = async (
  guildId: string
): Promise<SetupHealthCheck[]> => {
  await connectToDatabase()
  const config = await GuildConfiguration.findOne({ guildId }).lean()
  return buildSetupHealth(guildId, config as TGuildConfiguration | null)
}

export const getSetupHealthIssueCount = async (
  guildId: string
): Promise<number> => {
  const checks = await getSetupHealthChecks(guildId)
  return countSetupHealthIssues(checks)
}
