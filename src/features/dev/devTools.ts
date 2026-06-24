import {
  devCheckDatabase,
  devCheckEnv,
  devGetDiscordGuild,
  devGetFeatureFlags,
  devGetGuildConfig,
  devGetGuildStats,
  devGetHealthSnapshot,
  devGetPermissions,
  devGetRecentTransactions,
  devGetSessionInfo,
  devInvalidateCaches,
  devPing,
  devRevalidateGuild,
  devVerifyChannels
} from '@/actions/dev/dev.action'

export type DevTool = {
  id: string
  label: string
  run: (guildId: string) => Promise<unknown>
}

export const DEV_SYSTEM_TOOLS: DevTool[] = [
  { id: 'ping', label: 'Ping server', run: devPing },
  { id: 'db', label: 'Database', run: devCheckDatabase },
  { id: 'env', label: 'Environment', run: devCheckEnv },
  { id: 'session', label: 'Session', run: devGetSessionInfo },
  { id: 'permissions', label: 'Permissions', run: devGetPermissions },
  { id: 'revalidate', label: 'Revalidate pages', run: devRevalidateGuild },
  {
    id: 'invalidate',
    label: 'Invalidate Discord cache',
    run: devInvalidateCaches
  }
]

export const DEV_GUILD_TOOLS: DevTool[] = [
  { id: 'stats', label: 'DB stats', run: devGetGuildStats },
  { id: 'config', label: 'Guild config', run: devGetGuildConfig },
  { id: 'flags', label: 'Feature flags', run: devGetFeatureFlags },
  { id: 'transactions', label: 'Recent txs', run: devGetRecentTransactions },
  { id: 'health', label: 'Health snapshot', run: devGetHealthSnapshot }
]

export const DEV_DISCORD_TOOLS: DevTool[] = [
  { id: 'discord', label: 'Guild info', run: devGetDiscordGuild },
  { id: 'channels', label: 'Verify channels', run: devVerifyChannels }
]
