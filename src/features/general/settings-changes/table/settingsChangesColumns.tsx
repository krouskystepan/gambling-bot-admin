'use client'

import { ColumnDef } from '@tanstack/react-table'

import type { SettingsChangeRow } from '@/actions/database/settingsChanges.action'
import ColoredBadge from '@/components/badges/ColoredBadge'
import { getSettingsChangeSectionBadgeClass } from '@/components/badges/badgeStyles'
import { getValueAtPath } from '@/lib/settingsAudit/diffSettingsPaths'
import { createHiddenFilterColumn } from '@/lib/table/manualFilterColumn'
import { cn } from '@/lib/utils'

function formatValue(value: unknown): string {
  if (value === undefined) return '-'
  if (value === null) return 'null'
  if (typeof value === 'string') return value || '""'
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    const text = JSON.stringify(value)
    return text.length > 80 ? `${text.slice(0, 77)}…` : text
  } catch {
    return String(value)
  }
}

function changePaths(change: SettingsChangeRow): string[] {
  return change.changedPaths.length > 0 ? change.changedPaths : ['']
}

function PathLabel({ path }: { path: string }) {
  if (!path) {
    return <span className="font-mono text-xs">(root)</span>
  }

  const parts = path.split('.')
  const leaf = parts.at(-1) ?? path
  const parent = parts.slice(0, -1).join('.')

  return (
    <span className="font-mono text-xs break-all leading-5">
      {parent ? <span className="text-muted-foreground">{parent}.</span> : null}
      <span className="font-medium text-foreground">{leaf}</span>
    </span>
  )
}

export const settingsChangesColumns = (): ColumnDef<SettingsChangeRow>[] => [
  createHiddenFilterColumn<SettingsChangeRow>('staffId'),
  createHiddenFilterColumn<SettingsChangeRow>('section'),
  createHiddenFilterColumn<SettingsChangeRow>('occurredAt'),
  {
    header: 'Time',
    id: 'time',
    accessorKey: 'occurredAt',
    enableSorting: false,
    enableColumnFilter: false,
    size: 150,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
        {new Date(row.original.occurredAt).toLocaleString('cs')}
      </span>
    )
  },
  {
    header: 'Changed by',
    accessorKey: 'changedByUsername',
    enableSorting: false,
    size: 140,
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="truncate font-medium">
          {row.original.changedByUsername ?? 'Unknown'}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {row.original.changedBy}
        </div>
      </div>
    )
  },
  {
    header: 'Section',
    id: 'sectionBadge',
    accessorKey: 'section',
    enableSorting: false,
    enableColumnFilter: false,
    size: 100,
    cell: ({ row }) => (
      <ColoredBadge
        colorClass={getSettingsChangeSectionBadgeClass(row.original.section)}
      >
        {row.original.sectionLabel}
      </ColoredBadge>
    )
  },
  {
    header: 'Path',
    id: 'path',
    enableSorting: false,
    size: 280,
    cell: ({ row }) => (
      <div className="space-y-1.5">
        {changePaths(row.original).map((path) => (
          <div key={path || 'root'}>
            <PathLabel path={path} />
          </div>
        ))}
      </div>
    )
  },
  {
    header: 'Change',
    id: 'change',
    enableSorting: false,
    size: 220,
    cell: ({ row }) => (
      <div className="space-y-1.5">
        {changePaths(row.original).map((path) => {
          const before = formatValue(getValueAtPath(row.original.before, path))
          const after = formatValue(getValueAtPath(row.original.after, path))
          const unchanged = before === after

          return (
            <div
              key={path || 'root'}
              className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 font-mono text-xs leading-5"
            >
              <span
                className={cn(
                  'max-w-[9rem] truncate text-red-600 dark:text-red-400',
                  unchanged && 'text-muted-foreground'
                )}
                title={before}
              >
                {before}
              </span>
              <span className="shrink-0 text-muted-foreground" aria-hidden>
                →
              </span>
              <span
                className={cn(
                  'max-w-[9rem] truncate text-emerald-700 dark:text-emerald-400',
                  unchanged && 'text-muted-foreground'
                )}
                title={after}
              >
                {after}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
]
