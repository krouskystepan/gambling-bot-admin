const DISCORD_ADMINISTRATOR = BigInt(0x8)
const DISCORD_MANAGE_GUILD = BigInt(0x20)

type GuildPermissionFields = {
  owner?: boolean
  permissions?: string | number | bigint | null
}

export function hasGuildManageAccess(guild: GuildPermissionFields): boolean {
  if (guild.owner) {
    return true
  }

  try {
    const permissions = BigInt(guild.permissions ?? 0)

    return (
      (permissions & DISCORD_ADMINISTRATOR) === DISCORD_ADMINISTRATOR ||
      (permissions & DISCORD_MANAGE_GUILD) === DISCORD_MANAGE_GUILD
    )
  } catch {
    return false
  }
}
