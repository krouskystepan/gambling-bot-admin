import { requireGuildAccess } from '@/actions/perms'

export async function requireExportAccess(
  guildId: string
): Promise<{ ok: true } | { error: string; status: number }> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    const status =
      access.error === 'Unauthorized'
        ? 401
        : access.error === 'Rate limited'
          ? 429
          : 403
    return { error: access.error, status }
  }
  return { ok: true }
}
