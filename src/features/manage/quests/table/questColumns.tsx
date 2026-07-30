'use client'

import { ColumnDef } from '@tanstack/react-table'
import type { GlobalSettings } from 'gambling-bot-shared/guild'
import { formatQuestConditionSummary } from 'gambling-bot-shared/quests'
import type { TQuest } from 'gambling-bot-shared/quests'

import ColoredBadge from '@/components/badges/ColoredBadge'
import {
  getQuestEnabledBadgeClass,
  getQuestKindBadgeClass
} from '@/components/badges/badgeStyles'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { createHiddenFilterColumn } from '@/lib/table/manualFilterColumn'

import QuestActionsMenu from '../components/QuestActionsMenu'

export const questColumns = (
  guildId: string,
  globalSettings: GlobalSettings,
  questFeatureBlocked: boolean,
  questFeatureBlockMessage: string | null
): ColumnDef<TQuest>[] => [
  createHiddenFilterColumn<TQuest>('search'),
  {
    header: () => <span className="whitespace-nowrap">Kind</span>,
    accessorKey: 'kind',
    size: 88,
    minSize: 88,
    cell: ({ row }) => {
      const kind = row.getValue('kind') as TQuest['kind']
      return (
        <ColoredBadge
          colorClass={getQuestKindBadgeClass(kind)}
          className="capitalize"
        >
          {kind}
        </ColoredBadge>
      )
    }
  },
  {
    header: () => <span className="whitespace-nowrap">Name</span>,
    accessorKey: 'name',
    size: 180,
    minSize: 180,
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.getValue('name')}</p>
        {row.original.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {row.original.description}
          </p>
        ) : null}
      </div>
    )
  },
  {
    header: () => <span className="whitespace-nowrap">Condition</span>,
    id: 'conditionSummary',
    size: 220,
    minSize: 220,
    cell: ({ row }) => (
      <span className="text-sm">
        {formatQuestConditionSummary(row.original.condition)}
      </span>
    )
  },
  {
    header: () => <span className="whitespace-nowrap">Reward</span>,
    accessorKey: 'rewardAmount',
    size: 96,
    minSize: 96,
    cell: ({ row }) =>
      formatGuildMoney(row.getValue('rewardAmount'), globalSettings)
  },
  {
    header: () => <span className="whitespace-nowrap">Enabled</span>,
    accessorKey: 'enabled',
    size: 88,
    minSize: 88,
    cell: ({ row }) => {
      const enabled = row.getValue('enabled') as boolean
      return (
        <ColoredBadge
          colorClass={getQuestEnabledBadgeClass(
            enabled ? 'enabled' : 'disabled'
          )}
          className="capitalize"
        >
          {enabled ? 'Yes' : 'No'}
        </ColoredBadge>
      )
    }
  },
  {
    header: () => <span className="whitespace-nowrap">Sort</span>,
    accessorKey: 'sortOrder',
    size: 72,
    minSize: 72
  },
  {
    id: 'actions',
    header: () => <span className="whitespace-nowrap">Actions</span>,
    size: 72,
    minSize: 72,
    enableSorting: false,
    cell: ({ row }) => (
      <QuestActionsMenu
        guildId={guildId}
        quest={row.original}
        questFeatureBlocked={questFeatureBlocked}
        questFeatureBlockMessage={questFeatureBlockMessage}
      />
    )
  }
]
