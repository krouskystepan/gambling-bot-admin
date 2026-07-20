import {
  type SettingsChangeCounts,
  type SettingsChangeEntityFacets,
  type SettingsChangeRow,
  formatSettingsChangeSummary
} from '@/lib/settingsAudit/settingsChangeRows'
import {
  SETTINGS_CHANGE_SECTIONS,
  SETTINGS_CHANGE_SECTION_LABELS,
  type SettingsChangeSection
} from '@/lib/settingsAudit/settingsChangeSections'

import { DEMO_STAFF_MEMBERS, getDemoUsername } from './demoGuild'
import { createDemoRng, pick, randInt } from './demoRng'

type Template = {
  section: SettingsChangeSection
  paths: string[]
  before: Record<string, unknown>
  after: Record<string, unknown>
}

const TEMPLATES: Template[] = [
  {
    section: 'global',
    paths: ['currency', 'timezone'],
    before: { currency: 'CZK', timezone: 'Europe/Prague' },
    after: { currency: 'EUR', timezone: 'Europe/Berlin' }
  },
  {
    section: 'casino',
    paths: ['blackjack.rtp'],
    before: { blackjack: { rtp: 0.96 } },
    after: { blackjack: { rtp: 0.97 } }
  },
  {
    section: 'bonus',
    paths: ['baseReward', 'maxReward'],
    before: { baseReward: 100, maxReward: 1000 },
    after: { baseReward: 150, maxReward: 1500 }
  },
  {
    section: 'vip',
    paths: ['pricePerDay', 'maxMembers'],
    before: { pricePerDay: 500, maxMembers: 3 },
    after: { pricePerDay: 750, maxMembers: 5 }
  },
  {
    section: 'channels',
    paths: ['atm.actions', 'workerLogChannelId'],
    before: { atm: { actions: '111' }, workerLogChannelId: '' },
    after: { atm: { actions: '222' }, workerLogChannelId: '333' }
  },
  {
    section: 'moderation',
    paths: ['managerRoleId'],
    before: { managerRoleId: 'role-a', bannedRoleId: 'ban-1' },
    after: { managerRoleId: 'role-b', bannedRoleId: 'ban-1' }
  },
  {
    section: 'reset',
    paths: ['casinoSettings', 'globalSettings'],
    before: {
      casinoSettings: { rtp: 0.97 },
      globalSettings: { currency: 'EUR' }
    },
    after: {
      casinoSettings: { rtp: 0.96 },
      globalSettings: { currency: 'CZK' }
    }
  }
]

function buildRows(): SettingsChangeRow[] {
  const rng = createDemoRng(0x5e771)
  const now = Date.now()
  const rows: SettingsChangeRow[] = []

  for (let i = 0; i < 28; i++) {
    const template = pick(rng, TEMPLATES)
    const actor = pick(rng, DEMO_STAFF_MEMBERS)
    const occurredAt = new Date(now - i * randInt(rng, 4, 24) * 60 * 60 * 1000)

    rows.push({
      id: `demo-settings-change-${i}`,
      occurredAt,
      changedBy: actor.userId,
      changedByUsername: getDemoUsername(actor.userId),
      section: template.section,
      sectionLabel: SETTINGS_CHANGE_SECTION_LABELS[template.section],
      changedPaths: template.paths,
      summary: formatSettingsChangeSummary(template.paths),
      before: template.before,
      after: template.after
    })
  }

  return rows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
}

let cached: SettingsChangeRow[] | null = null
function getRows(): SettingsChangeRow[] {
  cached ??= buildRows()
  return cached
}

export type DemoSettingsChangesQuery = {
  page?: number
  limit?: number
  staffId?: string
  filterSection?: SettingsChangeSection[]
}

function matches(
  row: SettingsChangeRow,
  query: DemoSettingsChangesQuery
): boolean {
  if (query.staffId && row.changedBy !== query.staffId) return false
  if (
    query.filterSection?.length &&
    !query.filterSection.includes(row.section)
  ) {
    return false
  }
  return true
}

export function getDemoSettingsChanges(query: DemoSettingsChangesQuery): {
  changes: SettingsChangeRow[]
  total: number
} {
  const filtered = getRows().filter((row) => matches(row, query))
  const page = query.page && query.page > 0 ? query.page : 1
  const limit = query.limit && query.limit > 0 ? query.limit : 10
  const start = (page - 1) * limit
  return {
    changes: filtered.slice(start, start + limit),
    total: filtered.length
  }
}

export function getDemoSettingsChangeCounts(): SettingsChangeCounts {
  const counts = Object.fromEntries(
    SETTINGS_CHANGE_SECTIONS.map((section) => [section, 0])
  ) as SettingsChangeCounts

  for (const row of getRows()) {
    counts[row.section] += 1
  }

  return counts
}

export function getDemoSettingsChangeEntityFacets(): SettingsChangeEntityFacets {
  const staff: Record<string, number> = {}
  for (const row of getRows()) {
    staff[row.changedBy] = (staff[row.changedBy] ?? 0) + 1
  }
  return { staff }
}
