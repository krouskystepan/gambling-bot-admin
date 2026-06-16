'use server'

import { formatMoney } from 'gambling-bot-shared/common'
import { type GlobalSettings } from 'gambling-bot-shared/guild'

import { discordBotRequest } from '@/lib/discord/discordReq'

const DISCORD_GOLD = 0xf1c40f
const DISCORD_RED = 0xed4245

const TICKET_OPTIONS = [1, 5, 10, 25, 50, 100]

type DiscordEmbed = {
  title: string
  description: string
  color: number
  footer: { text: string }
}

type DiscordButton = {
  type: 2
  style: 3
  label: string
  custom_id: string
  emoji: { name: string }
}

type DiscordActionRow = {
  type: 1
  components: DiscordButton[]
}

type DiscordMessage = {
  id: string
}

function buildRaffleEmbed({
  ticketPrice,
  maxTickets,
  nextDrawAt,
  totalPot,
  drawId,
  canceled,
  globalSettings
}: {
  ticketPrice: number
  maxTickets: number
  nextDrawAt: Date
  totalPot: number
  drawId: string
  canceled?: boolean
  globalSettings?: Partial<GlobalSettings> | null
}): DiscordEmbed {
  const drawUnix = Math.floor(nextDrawAt.getTime() / 1000)
  const priceLabel = formatMoney(ticketPrice, globalSettings)
  const potLabel = formatMoney(totalPot, globalSettings)

  if (canceled) {
    return {
      title: '🎫 Global Raffle (Canceled)',
      description: [
        '❌ **This raffle has been canceled**',
        '',
        `💰 Ticket Price: **${priceLabel}**`,
        `🎟️ Ticket Limit: **${maxTickets}**`,
        '',
        '💸 All tickets have been refunded.'
      ].join('\n'),
      color: DISCORD_RED,
      footer: { text: `ID: ${drawId}` }
    }
  }

  return {
    title: '🎫 Global Raffle',
    description: [
      `💰 Ticket Price: **${priceLabel}**`,
      `🎟️ Ticket Limit: **${maxTickets}**`,
      '',
      `🗓️ Drawing Date: **<t:${drawUnix}:F>**`,
      '',
      `💸 Current Pot: **${potLabel}**`
    ].join('\n'),
    color: DISCORD_GOLD,
    footer: { text: `ID: ${drawId}` }
  }
}

function buildRaffleButtonRows(
  messageId: string,
  maxTickets: number
): DiscordActionRow[] {
  const allowedOptions = TICKET_OPTIONS.filter((qty) => qty <= maxTickets)
  const rows: DiscordActionRow[] = []
  let currentRow: DiscordButton[] = []

  for (let i = 0; i < allowedOptions.length; i++) {
    const qty = allowedOptions[i]

    currentRow.push({
      type: 2,
      style: 3,
      label: `Buy ${qty} Ticket${qty > 1 ? 's' : ''}`,
      custom_id: `raffle.${messageId}.${qty}`,
      emoji: { name: '🎫' }
    })

    if ((i + 1) % 3 === 0) {
      rows.push({ type: 1, components: currentRow })
      currentRow = []
    }
  }

  if (currentRow.length > 0) {
    rows.push({ type: 1, components: currentRow })
  }

  return rows
}

export async function postRaffleMessage({
  channelId,
  ticketPrice,
  maxTickets,
  nextDrawAt,
  drawId,
  globalSettings
}: {
  channelId: string
  ticketPrice: number
  maxTickets: number
  nextDrawAt: Date
  drawId: string
  globalSettings?: Partial<GlobalSettings> | null
}): Promise<string> {
  const embed = buildRaffleEmbed({
    ticketPrice,
    maxTickets,
    nextDrawAt,
    totalPot: 0,
    drawId,
    globalSettings
  })

  const message = await discordBotRequest<DiscordMessage>({
    url: `/channels/${channelId}/messages`,
    method: 'POST',
    data: { embeds: [embed] }
  })

  const buttonRows = buildRaffleButtonRows(message.id, maxTickets)

  await discordBotRequest({
    url: `/channels/${channelId}/messages/${message.id}`,
    method: 'PATCH',
    data: {
      embeds: [embed],
      components: buttonRows
    }
  })

  return message.id
}

export async function editRaffleMessageCanceled({
  channelId,
  messageId,
  ticketPrice,
  maxTickets,
  nextDrawAt,
  drawId,
  globalSettings
}: {
  channelId: string
  messageId: string
  ticketPrice: number
  maxTickets: number
  nextDrawAt: Date
  drawId: string
  globalSettings?: Partial<GlobalSettings> | null
}): Promise<void> {
  const embed = buildRaffleEmbed({
    ticketPrice,
    maxTickets,
    nextDrawAt,
    totalPot: 0,
    drawId,
    canceled: true,
    globalSettings
  })

  await discordBotRequest({
    url: `/channels/${channelId}/messages/${messageId}`,
    method: 'PATCH',
    data: {
      embeds: [embed],
      components: []
    }
  })
}

export async function deleteDiscordMessage(
  channelId: string,
  messageId: string
): Promise<void> {
  try {
    await discordBotRequest({
      url: `/channels/${channelId}/messages/${messageId}`,
      method: 'DELETE'
    })
  } catch (err) {
    console.error(
      `Failed to delete message ${messageId} in channel ${channelId}`,
      err
    )
  }
}
