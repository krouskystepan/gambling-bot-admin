'use server'

import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

import { discordBotRequest } from '@/lib/discordReq'

export const isBotInGuild = async (guildId: string): Promise<boolean> => {
  try {
    await discordBotRequest({
      url: `/guilds/${guildId}`,
      method: 'GET'
    })

    return true
  } catch {
    return false
  }
}

const rest = new REST({ version: '10' }).setToken(
  process.env.DISCORD_BOT_TOKEN!
)

export async function sendEmbed(
  channelId: string,
  title: string,
  description: string,
  color: number
): Promise<void> {
  if (!channelId) {
    throw new Error('No channel ID provided')
  }

  try {
    await rest.post(Routes.channelMessages(channelId), {
      body: {
        embeds: [
          {
            title,
            description,
            color
          }
        ]
      }
    })
  } catch (err) {
    console.error(`Failed to send embed to channel ${channelId}`, err)
  }
}
