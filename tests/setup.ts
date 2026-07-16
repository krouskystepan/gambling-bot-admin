import { vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/actions/perms', () => ({
  requireGuildAccess: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

vi.mock('@/actions/discord/utils.action', () => ({
  sendEmbed: vi.fn().mockResolvedValue(undefined),
  editDiscordMessage: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('@/actions/discord/raffleMessage.action', () => ({
  postRaffleMessage: vi.fn().mockResolvedValue('raffle-msg-1'),
  editRaffleMessageCanceled: vi.fn().mockResolvedValue(undefined),
  deleteDiscordMessage: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('@/actions/discord/member.action', () => ({
  getDiscordGuildMembers: vi.fn().mockResolvedValue([])
}))

vi.mock('@/lib/panel/panelFeatureActionGuard.server', () => ({
  blockPanelFeatureAction: vi.fn().mockResolvedValue(null),
  blockPanelMaintenanceAction: vi.fn().mockResolvedValue(null)
}))

vi.mock('@/lib/staffAudit/recordStaffAudit', () => ({
  recordStaffAudit: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('@/lib/guild/revalidateHealth', () => ({
  revalidateGuildHealth: vi.fn()
}))

process.env.DISCORD_CLIENT_ID ??= 'test-client-id'
process.env.DISCORD_CLIENT_SECRET ??= 'test-client-secret'
process.env.DISCORD_BOT_TOKEN ??= 'test-bot-token'
process.env.NEXTAUTH_SECRET ??= 'test-secret'
process.env.NEXTAUTH_URL ??= 'http://localhost:3000'
process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/gambling-bot-admin-test'

/**
 * Fail tests on unexpected process warnings (e.g. mongoose deprecations).
 */
const warningPattern =
  /MONGOOSE|DeprecationWarning|eslint-disable|ExperimentalWarning/

process.on('warning', (warning) => {
  if (
    warningPattern.test(warning.name) ||
    warningPattern.test(warning.message)
  ) {
    throw new Error(`Unexpected warning: ${warning.message}`)
  }
})
