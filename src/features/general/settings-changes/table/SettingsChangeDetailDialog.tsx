'use client'

import { useState } from 'react'

import type { SettingsChangeRow } from '@/actions/database/settingsChanges.action'
import ColoredBadge from '@/components/badges/ColoredBadge'
import { getSettingsChangeSectionBadgeClass } from '@/components/badges/badgeStyles'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { getValueAtPath } from '@/lib/settingsAudit/diffSettingsPaths'

function formatValue(value: unknown): string {
  if (value === undefined) return '—'
  if (value === null) return 'null'
  if (typeof value === 'string') return value || '""'
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const SettingsChangeDetailDialog = ({
  change
}: {
  change: SettingsChangeRow
}) => {
  const [open, setOpen] = useState(false)
  const paths =
    change.changedPaths.length > 0 ? change.changedPaths : ([''] as string[])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm text-primary"
        >
          View
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-4 sm:max-w-3xl">
        <DialogHeader className="gap-1">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Settings change
            <ColoredBadge
              colorClass={getSettingsChangeSectionBadgeClass(change.section)}
            >
              {change.sectionLabel}
            </ColoredBadge>
          </DialogTitle>
          <DialogDescription>
            {new Date(change.occurredAt).toLocaleString('cs')} ·{' '}
            {change.changedByUsername ?? 'Unknown'} ({change.changedBy})
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(70vh,36rem)] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 px-3">Path</TableHead>
                <TableHead className="h-9 px-3">Before</TableHead>
                <TableHead className="h-9 px-3">After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paths.map((path) => (
                <TableRow key={path || 'root'}>
                  <TableCell className="px-3 py-2 align-top font-mono text-xs">
                    {path || '(root)'}
                  </TableCell>
                  <TableCell className="px-3 py-2 align-top font-mono text-xs break-all text-muted-foreground">
                    {formatValue(getValueAtPath(change.before, path))}
                  </TableCell>
                  <TableCell className="px-3 py-2 align-top font-mono text-xs break-all">
                    {formatValue(getValueAtPath(change.after, path))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsChangeDetailDialog
