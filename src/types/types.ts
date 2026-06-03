import {
  APIChannel,
  APIRole,
  RESTAPIPartialCurrentUserGuild
} from 'discord-api-types/v10'
import { TTransaction, TVipRoom } from 'gambling-bot-shared'
import { UseFormReturn } from 'react-hook-form'
import z from 'zod'

import {
  bonusFormSchema,
  casinoSettingsSchema,
  channelsFormSchema,
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

export type TGuildMemberStatus = {
  userId: string
  username: string
  nickname: string | null
  registered: boolean
  registeredAt: Date | null
  avatar: string
  balance?: number
  netProfit?: number
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

export interface TTransactionDiscord extends Pick<
  TTransaction,
  | 'userId'
  | 'type'
  | 'amount'
  | 'source'
  | 'createdAt'
  | 'betId'
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

export type ITransactionCounts = {
  type: Record<TTransaction['type'], number>
  source: Record<TTransaction['source'], number>
}

export type TUpdateUrl = {
  page: number
  limit?: number
  search?: string
  adminSearch?: string
  filterType?: string
  filterSource?: string
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
