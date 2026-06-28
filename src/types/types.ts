import {
  APIChannel,
  APIRole,
  RESTAPIPartialCurrentUserGuild
} from 'discord-api-types/v10'
import { TAtmRequest } from 'gambling-bot-shared/atm'
import { TPrediction } from 'gambling-bot-shared/predictions'
import { TRaffle } from 'gambling-bot-shared/raffle'
import { TTransaction } from 'gambling-bot-shared/transactions'
import { TVipRoom } from 'gambling-bot-shared/vip'
import { UseFormReturn } from 'react-hook-form'
import z from 'zod'

import {
  bonusFormSchema,
  casinoSettingsSchema,
  channelsFormSchema,
  globalSettingsFormSchema,
  managerRoleFormSchema,
  vipSettingsFormSchema
} from './schemas'

export type IGuild = RESTAPIPartialCurrentUserGuild
export type IGuildChannel = APIChannel
export type IGuildRole = APIRole

export type TChannelsFormValues = z.infer<typeof channelsFormSchema>
export type TCasinoSettingsInput = z.input<typeof casinoSettingsSchema>
export type TCasinoSettingsValues = z.output<typeof casinoSettingsSchema>
export type TCasinoSettingsForm = UseFormReturn<
  TCasinoSettingsInput,
  unknown,
  TCasinoSettingsValues
>
export type TManagerRoleValues = z.infer<typeof managerRoleFormSchema>
export type TVipSettingsValues = z.infer<typeof vipSettingsFormSchema>
export type TBonusFormInput = z.input<typeof bonusFormSchema>
export type TBonusFormValues = z.output<typeof bonusFormSchema>
export type TGlobalSettingsFormInput = z.input<typeof globalSettingsFormSchema>
export type TGlobalSettingsFormValues = z.output<
  typeof globalSettingsFormSchema
>

export type TGuildMemberStatus = {
  userId: string
  username: string
  nickname: string | null
  registered: boolean
  registeredAt: Date | null
  avatar: string
  balance?: number
  netProfit?: number
  banned?: boolean
}

export type TVipChannels = Omit<TVipRoom, 'updatedAt' | 'memberIds'> & {
  channelName: string
  username: string
  nickname: string
  members: {
    userId: string
    username: string
    nickname: string
    avatar: string
  }[]
  avatar: string
}

export type TRaffleRow = TRaffle & {
  channelName: string
  creatorUsername: string
  creatorAvatar: string
  totalTickets: number
  totalPot: number
  intervalLabel: string
  participantCount: number
}

export type TPredictionRow = TPrediction & {
  channelName: string
  creatorUsername: string
  creatorAvatar: string
  totalBetAmount: number
  bettorCount: number
  choicesEnriched: {
    choiceName: string
    odds: number
    betCount: number
    totalAmount: number
  }[]
}

export type TPredictionDetail = {
  predictionId: string
  title: string
  status: TPrediction['status']
  autolock?: Date | null
  totalBetAmount: number
  bettorCount: number
  choices: {
    choiceName: string
    odds: number
    betCount: number
    totalBetAmount: number
    payoutIfWins: number
    bets: {
      userId: string
      amount: number
      betId: string
      username: string
      avatar: string
    }[]
  }[]
}

export interface TTransactionDiscord extends Pick<
  TTransaction,
  | 'userId'
  | 'type'
  | 'amount'
  | 'source'
  | 'createdAt'
  | 'referenceId'
  | 'handledBy'
  | 'meta'
> {
  id: string
  username: string
  nickname: string | null
  avatar: string
  handledByUsername?: string | null
  dateFrom?: string
  dateTo?: string
}

export interface TAtmRequestDiscord extends TAtmRequest {
  id: string
  username: string
  nickname: string | null
  avatar: string
  handledByUsername?: string | null
  linkedTransactionId?: string | null
}

export type IAtmRequestCounts = {
  pending: number
  approved: number
  rejected: number
  total: number
  type: {
    deposit: number
    withdraw: number
  }
  amount: {
    pendingDeposits: number
    pendingWithdraws: number
  }
  users: Record<string, number>
}

export type ITransactionCounts = {
  type: Record<TTransaction['type'], number>
  source: Record<TTransaction['source'], number>
  casinoGame: Record<string, number>
  staff: Record<string, number>
  users: Record<string, number>
}

export type TUpdateUrl = {
  page: number
  limit?: number
  search?: string
  referenceId?: string
  filterType?: string
  filterSource?: string
  filterCasinoGame?: string
  sort?: string
}

// Cache
export interface ICacheEntry<T> {
  data: T
  expiresAt: number
}

export interface IMemberCacheEntry {
  roles: string[]
  expiresAt: number
}

export interface IChannelsCacheEntry {
  data: IGuildChannel[]
  expiresAt: number
}
