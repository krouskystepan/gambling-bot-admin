import {
  BonusesSettingsPage,
  CasinoSettingsPage,
  ChannelSettingsPage,
  HomePage,
  ManagerSettingsPage,
  TransactionsPage,
  UsersPage,
  VipSettingsPage
} from '@/features'

export const sections = {
  // General
  home: HomePage,
  transactions: TransactionsPage,
  // Manage
  users: UsersPage,
  // Settings
  'channel-settings': ChannelSettingsPage,
  'casino-settings': CasinoSettingsPage,
  'manager-settings': ManagerSettingsPage,
  'bonus-settings': BonusesSettingsPage,
  'vip-settings': VipSettingsPage
} as const

export type SectionId = keyof typeof sections
