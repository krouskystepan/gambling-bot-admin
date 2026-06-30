import {
  Activity,
  Award,
  Banknote,
  Calculator,
  ChartBar,
  Crown,
  Database,
  Dices,
  FileBarChart,
  Globe,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  MessagesSquare,
  ScrollText,
  Server,
  ShieldCheck,
  Ticket,
  Trash2,
  User
} from 'lucide-react'

export const GUILD_CONFIG_SIDEBAR_LINKS = [
  {
    title: 'General',
    value: 'general',
    links: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'health', label: 'Health', icon: HeartPulse },
      { id: 'atm-queue', label: 'ATM Queue', icon: Banknote },
      { id: 'transactions', label: 'Transactions', icon: Landmark },
      { id: 'staff-actions', label: 'Staff actions', icon: ScrollText },
      { id: 'reports', label: 'Reports', icon: FileBarChart }
    ]
  },
  {
    title: 'Manage',
    value: 'manage',
    links: [
      { id: 'users', label: 'Users', icon: User },
      { id: 'predictions', label: 'Predictions', icon: ChartBar },
      { id: 'raffles', label: 'Raffles', icon: Ticket },
      { id: 'vips', label: 'VIPs', icon: Crown }
    ]
  },
  {
    title: 'Settings',
    value: 'settings',
    links: [
      { id: 'global-settings', label: 'Global', icon: Globe },
      { id: 'channel-settings', label: 'Channels', icon: MessagesSquare },
      { id: 'moderation-settings', label: 'Moderation', icon: ShieldCheck },
      { id: 'casino-settings', label: 'Casino', icon: Dices },
      { id: 'bonus-settings', label: 'Bonuses', icon: Award },
      { id: 'vip-settings', label: 'VIP', icon: Crown }
    ]
  },
  {
    title: 'Development',
    value: 'dev',
    links: [
      { id: 'dev', label: 'Overview', icon: Activity },
      { id: 'dev-system', label: 'Platform', icon: Server },
      { id: 'dev-guild', label: 'Guild', icon: Database },
      { id: 'dev-data', label: 'Danger zone', icon: Trash2 },
      { id: 'dev-calcs', label: 'Simulations', icon: Calculator },
      { id: 'dev-ui', label: 'UI kit', icon: LayoutTemplate }
    ]
  }
] as const

export const DEFAULT_GUILD_CONFIG_OPEN_SECTIONS =
  GUILD_CONFIG_SIDEBAR_LINKS.map((group) => group.value)
