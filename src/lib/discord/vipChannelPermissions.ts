import { PermissionFlagsBits } from 'discord-api-types/v10'

export const VIP_CHANNEL_ACCESS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages
]

export const VIP_CHANNEL_READ_ONLY = {
  allow: [PermissionFlagsBits.ViewChannel],
  deny: [PermissionFlagsBits.SendMessages]
}
