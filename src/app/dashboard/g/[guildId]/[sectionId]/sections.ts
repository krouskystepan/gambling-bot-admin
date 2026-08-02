import {
  AtmQueuePage,
  BansPage,
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
  ModerationSettingsPage,
  OverviewPage,
  PaySettingsPage,
  PredictionsPage,
  QuestsPage,
  RafflesPage,
  ReportsPage,
  SettingsChangesPage,
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
  'settings-changes': SettingsChangesPage,
  'atm-queue': AtmQueuePage,
  health: HealthPage,

  // Manage
  users: UsersPage,
  bans: BansPage,
  raffles: RafflesPage,
  predictions: PredictionsPage,
  quests: QuestsPage,
  vips: VipPage,

  // Settings
  'global-settings': GlobalSettingsPage,
  'channel-settings': ChannelSettingsPage,
  'casino-settings': CasinoSettingsPage,
  'manager-settings': ModerationSettingsPage,
  'moderation-settings': ModerationSettingsPage,
  'bonus-settings': BonusesSettingsPage,
  'vip-settings': VipSettingsPage,
  'pay-settings': PaySettingsPage,

  // Dev
  dev: DevOverviewPage,
  'dev-system': DevSystemPage,
  'dev-guild': DevGuildPage,
  'dev-calcs': DevCalcsPage,
  'dev-ui': DevUiPage,
  'dev-data': DevDataOpsPage
} as const

export type SectionId = keyof typeof sections
