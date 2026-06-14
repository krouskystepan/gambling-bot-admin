'use server'

import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

import { discordBotRequest } from '@/lib/discordReq'

const rest = new REST({ version: '10' }).setToken(
  process.env.DISCORD_BOT_TOKEN!
)

function rethrowDiscordError(err: unknown): never {
  if (err instanceof Error && err.message === 'DiscordRateLimited') {
    throw err
  }
  throw err
}

function permissionBits(flags: bigint[]): string {
  return flags.reduce((acc, bit) => acc | bit, BigInt(0)).toString()
}

export async function createGuildTextChannel(
  guildId: string,
  name: string,
  parentId: string
): Promise<{ id: string }> {
  try {
    return await discordBotRequest<{ id: string }>({
      url: `/guilds/${guildId}/channels`,
      method: 'POST',
      data: {
        name,
        type: 0,
        parent_id: parentId
      }
    })
  } catch (err) {
    rethrowDiscordError(err)
  }
}

export async function deleteGuildChannel(channelId: string): Promise<void> {
  try {
    await discordBotRequest({
      url: `/channels/${channelId}`,
      method: 'DELETE'
    })
  } catch (err) {
    rethrowDiscordError(err)
  }
}

export async function setChannelPermissionOverwrite(
  channelId: string,
  userId: string,
  allow: bigint[],
  deny: bigint[] = []
): Promise<void> {
  try {
    await discordBotRequest({
      url: `/channels/${channelId}/permissions/${userId}`,
      method: 'PUT',
      data: {
        type: 1,
        allow: permissionBits(allow),
        deny: permissionBits(deny)
      }
    })
  } catch (err) {
    rethrowDiscordError(err)
  }
}

export async function deleteChannelPermissionOverwrite(
  channelId: string,
  userId: string
): Promise<void> {
  try {
    await discordBotRequest({
      url: `/channels/${channelId}/permissions/${userId}`,
      method: 'DELETE'
    })
  } catch {
    // Best-effort cleanup, same as the Discord bot command.
  }
}

export async function addGuildMemberRole(
  guildId: string,
  userId: string,
  roleId: string,
  reason?: string
): Promise<void> {
  try {
    await discordBotRequest({
      url: `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      method: 'PUT',
      headers: reason ? { 'X-Audit-Log-Reason': reason } : undefined
    })
  } catch (err) {
    rethrowDiscordError(err)
  }
}

export async function removeGuildMemberRole(
  guildId: string,
  userId: string,
  roleId: string,
  reason?: string
): Promise<void> {
  try {
    await discordBotRequest({
      url: `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      method: 'DELETE',
      headers: reason ? { 'X-Audit-Log-Reason': reason } : undefined
    })
  } catch {
    // Best-effort cleanup, same as the Discord bot command.
  }
}

export async function sendChannelEmbed(
  channelId: string,
  title: string,
  description: string,
  color: number,
  pingUserId?: string
): Promise<string | null> {
  try {
    const message = (await rest.post(Routes.channelMessages(channelId), {
      body: {
        content: pingUserId ? `<@${pingUserId}>` : '',
        embeds: [{ title, description, color }]
      }
    })) as { id: string }

    return message.id
  } catch (err) {
    console.error(`Failed to send embed to channel ${channelId}`, err)
    return null
  }
}

export async function sendChannelEmbedAndPin(
  channelId: string,
  title: string,
  description: string,
  color: number,
  options?: { content?: string; pingUserId?: string }
): Promise<void> {
  try {
    const message = (await rest.post(Routes.channelMessages(channelId), {
      body: {
        content: options?.pingUserId
          ? `<@${options.pingUserId}>`
          : (options?.content ?? ''),
        embeds: [{ title, description, color }]
      }
    })) as { id: string }

    await rest.put(Routes.channelMessagesPin(channelId, message.id))
  } catch (err) {
    console.error(`Failed to send/pin embed in channel ${channelId}`, err)
  }
}
