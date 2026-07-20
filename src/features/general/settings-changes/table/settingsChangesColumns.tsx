'use client'

import { ColumnDef } from '@tanstack/react-table'

import type { SettingsChangeRow } from '@/actions/database/settingsChanges.action'
import ColoredBadge from '@/components/badges/ColoredBadge'
import { getSettingsChangeSectionBadgeClass } from '@/components/badges/badgeStyles'
import { createHiddenFilterColumn } from '@/lib/table/manualFilterColumn'

import SettingsChangeDetailDialog from './SettingsChangeDetailDialog'

export const settingsChangesColumns = (): ColumnDef<SettingsChangeRow>[] => [
  createHiddenFilterColumn<SettingsChangeRow>('staffId'),
  createHiddenFilterColumn<SettingsChangeRow>('section'),
  createHiddenFilterColumn<SettingsChangeRow>('occurredAt'),
  {
    header: 'Time',
    accessorKey: 'occurredAt',
    enableSorting: false,
    size: 160,
    cell: ({ row }) => new Date(row.getValue('occurredAt')).toLocaleString('cs')
  },
  {
    header: 'Changed by',
    accessorKey: 'changedByUsername',
    enableSorting: false,
    size: 140,
    cell: ({ row }) => (
      <div>
        {row.original.changedByUsername ?? 'Unknown'}
        <br />
        <span className="text-xs text-muted-foreground">
          ({row.original.changedBy})
        </span>
      </div>
    )
  },
  {
    header: 'Section',
    accessorKey: 'section',
    enableSorting: false,
    size: 110,
    cell: ({ row }) => (
      <ColoredBadge
        colorClass={getSettingsChangeSectionBadgeClass(row.original.section)}
      >
        {row.original.sectionLabel}
      </ColoredBadge>
    )
  },
  {
    header: 'Summary',
    accessorKey: 'summary',
    enableSorting: false,
    size: 260,
    cell: ({ row }) => {
      const { changedPaths, summary } = row.original
      if (changedPaths.length <= 3) {
        return <span className="text-sm">{summary}</span>
      }

      return (
        <div className="text-sm">
          <span>{summary}</span>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {changedPaths.slice(0, 4).join(', ')}
            {changedPaths.length > 4 ? '…' : ''}
          </p>
        </div>
      )
    }
  },
  {
    header: 'Details',
    id: 'details',
    enableSorting: false,
    size: 90,
    cell: ({ row }) => <SettingsChangeDetailDialog change={row.original} />
  }
]
