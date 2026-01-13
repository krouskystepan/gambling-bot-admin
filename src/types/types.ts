import { TTransaction } from 'gambling-bot-shared'
import z from 'zod'

import {
  bonusFormSchema,
  casinoSettingsSchema,
  channelsFormSchema,
  managerRoleFormSchema,
  vipSettingsFormSchema
} from './schemas'

export interface IGuild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: number
}

export interface IGuildChannel {
  id: string
  name: string
  type: number
}

export interface IGuildRole {
  id: string
  name: string
  color: number
  hoist: boolean
  position: number
  managed: boolean
  mentionable: boolean
  permissions: string
}

export type TChannelsFormValues = z.infer<typeof channelsFormSchema>
export type TCasinoSettingsValues = z.infer<typeof casinoSettingsSchema>
export type TCasinoSettingsOutput = z.output<typeof casinoSettingsSchema>
export type TManagerRoleValues = z.infer<typeof managerRoleFormSchema>
export type TVipSettingsValues = z.infer<typeof vipSettingsFormSchema>
export type TBonusFormValues = z.infer<typeof bonusFormSchema>

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

export type TVipChannels = {
  ownerId: string
  guildId: string
  channelId: string
  channelName: string
  expiresAt: Date
  createdAt: Date
  username: string
  nickname: string
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
