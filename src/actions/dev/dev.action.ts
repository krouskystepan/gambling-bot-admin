'use server'

import { revalidatePath } from 'next/cache'

import { getHealthPageData } from '@/actions/database/health.action'
import { getGuildName } from '@/actions/discord/guilds.action'
import { getUserPermissions } from '@/actions/perms'
import {
  getDevBotPresence,
  getDevChannelChecks,
  getDevDatabaseStatus,
  getDevEnvStatus,
  getDevFeatureFlags,
  getDevGuildConfig,
  getDevGuildCounts,
  getDevRecentTransactions,
  invalidateDevDiscordCaches
} from '@/lib/dev/devGuildDiagnostics'
import { requireDevAction } from '@/lib/dev/requireDevAction'
import { discordBotRequest } from '@/lib/discord/discordReq'

export async function devPing(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access
  return { ok: true as const, serverTime: new Date().toISOString() }
}

export async function devCheckDatabase(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  try {
    const status = await getDevDatabaseStatus()
    return { ok: true as const, ...status }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Database check failed'
    }
  }
}

export async function devCheckEnv(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access
  return { ok: true as const, ...(await getDevEnvStatus()) }
}

export async function devGetGuildStats(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  try {
    return { ok: true as const, stats: await getDevGuildCounts(guildId) }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Failed to load guild stats'
    }
  }
}

export async function devGetGuildConfig(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  try {
    return { ok: true as const, config: await getDevGuildConfig(guildId) }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Failed to load guild config'
    }
  }
}

export async function devGetFeatureFlags(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  try {
    const flags = await getDevFeatureFlags(guildId)
    return {
      ok: true as const,
      flags,
      disabledCount: flags.filter((flag) => flag.disabled).length
    }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Failed to load feature flags'
    }
  }
}

export async function devGetRecentTransactions(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  try {
    return {
      ok: true as const,
      transactions: await getDevRecentTransactions(guildId)
    }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Failed to load transactions'
    }
  }
}

export async function devVerifyChannels(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  try {
    const channels = await getDevChannelChecks(guildId)
    return {
      ok: true as const,
      channels,
      missingCount: channels.filter(
        (channel) => channel.channelId && !channel.exists
      ).length,
      unsetCount: channels.filter((channel) => !channel.channelId).length
    }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Channel verification failed'
    }
  }
}

type DiscordGuildPreview = {
  id: string
  name: string
  memberCount?: number
  approximateMemberCount?: number
}

export async function devGetDiscordGuild(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  try {
    const presence = await getDevBotPresence(guildId)
    if (!presence.inGuild) {
      return { ok: true as const, inGuild: false, guild: null }
    }

    const guild = await discordBotRequest<DiscordGuildPreview>({
      url: `/guilds/${guildId}?with_counts=true`,
      method: 'GET'
    })

    return { ok: true as const, inGuild: true, guild }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Discord guild lookup failed'
    }
  }
}

export async function devGetPermissions(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  const perms = await getUserPermissions(guildId, access.session)
  const guildName = await getGuildName(guildId)

  return {
    ok: true as const,
    guildName,
    ...perms,
    isDev: true
  }
}

export async function devGetSessionInfo(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  const { session } = access

  return {
    ok: true as const,
    userId: session.userId,
    hasAccessToken: Boolean(session.accessToken),
    sessionError: session.error
  }
}

export async function devGetHealthSnapshot(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  const data = await getHealthPageData(guildId, access.session)
  if (!data) {
    return { ok: false as const, error: 'Health data unavailable' }
  }

  return { ok: true as const, ...data }
}

export async function devInvalidateCaches(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  return { ok: true as const, ...(await invalidateDevDiscordCaches(guildId)) }
}

export async function devRevalidateGuild(guildId: string) {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  const paths = [
    `/dashboard/g/${guildId}`,
    `/dashboard/g/${guildId}/overview`,
    `/dashboard/g/${guildId}/health`,
    `/dashboard/g/${guildId}/atm-queue`,
    `/dashboard/g/${guildId}/transactions`,
    `/dashboard/g/${guildId}/users`,
    `/dashboard/g/${guildId}/predictions`,
    `/dashboard/g/${guildId}/raffles`,
    `/dashboard/g/${guildId}/vips`
  ]

  for (const path of paths) {
    revalidatePath(path, path === `/dashboard/g/${guildId}` ? 'layout' : 'page')
  }

  return { ok: true as const, paths }
}
