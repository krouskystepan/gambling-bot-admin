import {
  AtmQueuePage,
  BonusesSettingsPage,
  CasinoSettingsPage,
  ChannelSettingsPage,
  DevCalcsPage,
  DevDataOpsPage,
  DevGuildPage,
  DevOverviewPage,
  DevSystemPage,
  DevUiPage,
  GlobalSettingsPage,
  HealthPage,
  ManagerSettingsPage,
  OverviewPage,
  PredictionsPage,
  RafflesPage,
  ReportsPage,
  StaffActionsPage,
  TransactionsPage,
  UsersPage,
  VipPage,
  VipSettingsPage
} from '@/features'

export const sections = {
  // General
  overview: OverviewPage,
  reports: ReportsPage,
  transactions: TransactionsPage,
  'staff-actions': StaffActionsPage,
  'atm-queue': AtmQueuePage,
  health: HealthPage,

  // Manage
  users: UsersPage,
  raffles: RafflesPage,
  predictions: PredictionsPage,
  vips: VipPage,

  // Settings
  'global-settings': GlobalSettingsPage,
  'channel-settings': ChannelSettingsPage,
  'casino-settings': CasinoSettingsPage,
  'manager-settings': ManagerSettingsPage,
  'bonus-settings': BonusesSettingsPage,
  'vip-settings': VipSettingsPage,

  // Dev
  dev: DevOverviewPage,
  'dev-system': DevSystemPage,
  'dev-guild': DevGuildPage,
  'dev-calcs': DevCalcsPage,
  'dev-ui': DevUiPage,
  'dev-data': DevDataOpsPage
} as const

export type SectionId = keyof typeof sections
