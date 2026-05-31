import { PermissionFlagsBits } from 'discord-api-types/v10'

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
      (permissions & PermissionFlagsBits.Administrator) ===
        PermissionFlagsBits.Administrator ||
      (permissions & PermissionFlagsBits.ManageGuild) ===
        PermissionFlagsBits.ManageGuild
    )
  } catch {
    return false
  }
}
