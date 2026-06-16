'use server'

import { formatMoney } from 'gambling-bot-shared/common'
import { type GlobalSettings } from 'gambling-bot-shared/guild'
import { type PredictionPayoutSummary } from 'gambling-bot-shared/predictions'

import { discordBotRequest } from '@/lib/discord/discordReq'

const DISCORD_YELLOW = 0xfee75c
const DISCORD_ORANGE = 0xfaa61a
const DISCORD_GREEN = 0x57f287
const DISCORD_RED = 0xed4245

type DiscordEmbed = {
  title: string
  description?: string
  color: number
  footer?: { text: string }
  timestamp?: string
  fields?: { name: string; value: string; inline?: boolean }[]
}

type DiscordButton = {
  type: 2
  style: 1
  label: string
  custom_id: string
}

type DiscordActionRow = {
  type: 1
  components: DiscordButton[]
}

type DiscordMessage = {
  id: string
}

function buildPredictionEmbed({
  title,
  choices,
  messageId,
  color
}: {
  title: string
  choices: { choiceName: string; odds: number }[]
  messageId: string
  color: number
}): DiscordEmbed {
  return {
    title,
    description: choices
      .map((c) => `- **${c.choiceName}** — ${c.odds}x`)
      .join('\n'),
    footer: { text: `ID: ${messageId}` },
    color,
    timestamp: new Date().toISOString()
  }
}

function buildPredictionButtons(
  messageId: string,
  choices: { choiceName: string; odds: number }[]
): DiscordActionRow[] {
  const buttons: DiscordButton[] = choices.map((c) => ({
    type: 2,
    style: 1,
    label: c.choiceName,
    custom_id: `prediction.${messageId}.${c.choiceName}.${c.odds}`
  }))

  return [{ type: 1, components: buttons }]
}

export async function postPredictionMessage({
  channelId,
  title,
  choices,
  autolock
}: {
  channelId: string
  title: string
  choices: { choiceName: string; odds: number }[]
  autolock?: Date | null
}): Promise<string> {
  const message = await discordBotRequest<DiscordMessage>({
    url: `/channels/${channelId}/messages`,
    method: 'POST',
    data: { content: 'Creating prediction...' }
  })

  const autolockString = autolock
    ? `\nAuto-Lock: <t:${Math.floor(autolock.getTime() / 1000)}:f>`
    : ''

  const embed = buildPredictionEmbed({
    title,
    choices,
    messageId: message.id,
    color: DISCORD_YELLOW
  })

  await discordBotRequest({
    url: `/channels/${channelId}/messages/${message.id}`,
    method: 'PATCH',
    data: {
      content: `**Status:** Active${autolockString}`,
      embeds: [embed],
      components: buildPredictionButtons(message.id, choices)
    }
  })

  return message.id
}

export async function updatePredictionMessageEnded({
  channelId,
  messageId,
  title,
  choices
}: {
  channelId: string
  messageId: string
  title: string
  choices: { choiceName: string; odds: number }[]
}): Promise<void> {
  const embed = buildPredictionEmbed({
    title,
    choices,
    messageId,
    color: DISCORD_ORANGE
  })

  await discordBotRequest({
    url: `/channels/${channelId}/messages/${messageId}`,
    method: 'PATCH',
    data: {
      content: '**Status:** Ended',
      embeds: [embed],
      components: []
    }
  })
}

export async function updatePredictionMessagePaid({
  channelId,
  messageId,
  title,
  choices,
  winnerChoice
}: {
  channelId: string
  messageId: string
  title: string
  choices: { choiceName: string; odds: number }[]
  winnerChoice: string
}): Promise<void> {
  const embed = buildPredictionEmbed({
    title,
    choices,
    messageId,
    color: DISCORD_GREEN
  })

  await discordBotRequest({
    url: `/channels/${channelId}/messages/${messageId}`,
    method: 'PATCH',
    data: {
      content: `**Status:** Paid (Winner: ${winnerChoice})`,
      embeds: [embed],
      components: []
    }
  })
}

export async function updatePredictionMessageCanceled({
  channelId,
  messageId,
  title,
  choices
}: {
  channelId: string
  messageId: string
  title: string
  choices: { choiceName: string; odds: number }[]
}): Promise<void> {
  const embed = buildPredictionEmbed({
    title,
    choices,
    messageId,
    color: DISCORD_RED
  })

  await discordBotRequest({
    url: `/channels/${channelId}/messages/${messageId}`,
    method: 'PATCH',
    data: {
      content: '**Status:** Canceled — All bets refunded',
      embeds: [embed],
      components: []
    }
  })
}

export async function sendPredictionPayoutLog({
  logsChannelId,
  title,
  summary,
  globalSettings,
  memberMentions
}: {
  logsChannelId: string
  title: string
  summary: PredictionPayoutSummary
  globalSettings?: Partial<GlobalSettings> | null
  memberMentions: Map<string, string>
}): Promise<void> {
  const winnersDisplay = summary.winners.map((w) => {
    const mention = memberMentions.get(w.userId) ?? 'Unknown'
    return `${mention} (Bet: ${formatMoney(w.betAmount, globalSettings)}, Win: ${formatMoney(w.winAmount, globalSettings)})`
  })

  const losersDisplay = summary.losers.map((l) => {
    const mention = memberMentions.get(l.userId) ?? 'Unknown'
    return `${mention} (Bet: ${formatMoney(l.betAmount, globalSettings)}, Win: ${formatMoney(0, globalSettings)})`
  })

  const embed: DiscordEmbed = {
    title: `Prediction Payout - ${title}`,
    color: summary.casinoProfit >= 0 ? DISCORD_GREEN : DISCORD_RED,
    fields: [
      {
        name: 'Participants',
        value: `${summary.participants}`,
        inline: true
      },
      {
        name: 'Winners',
        value: `${summary.winners.length}`,
        inline: true
      },
      {
        name: 'Losers',
        value: `${summary.losers.length}`,
        inline: true
      },
      {
        name: 'Casino Profit/Loss',
        value: formatMoney(summary.casinoProfit, globalSettings),
        inline: true
      },
      {
        name: 'Winners Detail',
        value: winnersDisplay.join('\n') || 'None'
      },
      {
        name: 'Losers Detail',
        value: losersDisplay.join('\n') || 'None'
      }
    ]
  }

  await discordBotRequest({
    url: `/channels/${logsChannelId}/messages`,
    method: 'POST',
    data: { embeds: [embed] }
  })
}

export async function deletePredictionMessage(
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
      `Failed to delete prediction message ${messageId} in channel ${channelId}`,
      err
    )
  }
}
