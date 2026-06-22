import { formatNumberWithSpaces } from 'gambling-bot-shared/common'
import { ExternalLink, User } from 'lucide-react'

import Link from 'next/link'

import type { SystemHealthItem } from '@/actions/database/systemHealth.action'
import { Button } from '@/components/ui/button'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatAgeMs } from '@/lib/systemHealth/formatAge'

export type OperationsItemListProps = {
  items: SystemHealthItem[]
  totalCount?: number
  viewAllHref?: string
  viewAllLabel?: string
  emptyLabel?: string
}

const actionButtonClassName =
  'inline-flex rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'

const getStatusLabel = (subtitle: string, ageMs: number) => {
  const age = formatAgeMs(ageMs)
  if (subtitle === age) return null

  const suffix = ` · ${age}`
  if (subtitle.endsWith(suffix)) {
    const status = subtitle.slice(0, -suffix.length)
    return status || null
  }

  return subtitle
}

const OperationsItemList = ({
  items,
  totalCount,
  viewAllHref,
  viewAllLabel = 'View all',
  emptyLabel = 'Nothing to show'
}: OperationsItemListProps) => {
  const shown = items.length
  const total = totalCount ?? shown
  const hasMore = total > shown

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Details
        </h4>
        {total > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {hasMore
              ? `${formatNumberWithSpaces(shown)} of ${formatNumberWithSpaces(total)}`
              : formatNumberWithSpaces(total)}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/60 bg-background/40">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.length > 0 ? (
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 px-3">Item</TableHead>
                  <TableHead className="h-8 w-20 px-3 text-right">
                    Age
                  </TableHead>
                  <TableHead className="h-8 w-16 px-2 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const status = getStatusLabel(item.subtitle, item.ageMs)
                  const age = formatAgeMs(item.ageMs)

                  return (
                    <TableRow
                      key={`${item.title}-${item.ageMs}-${index}`}
                      className="text-sm"
                    >
                      <TableCell className="max-w-0 px-3 py-1.5">
                        <p
                          className="truncate font-medium text-foreground"
                          title={item.title}
                        >
                          {item.title}
                        </p>
                        {status ? (
                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={status}
                          >
                            {status}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="px-3 py-1.5 text-right text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {age}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right">
                        <div className="inline-flex items-center justify-end gap-0.5">
                          {item.adminHref ? (
                            <Link
                              href={item.adminHref}
                              className={actionButtonClassName}
                              title="Open user profile"
                            >
                              <User size={14} />
                            </Link>
                          ) : null}
                          {item.discordHref ? (
                            <a
                              href={item.discordHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={actionButtonClassName}
                              title="Open in Discord"
                            >
                              <ExternalLink size={14} />
                            </a>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </table>
          ) : (
            <div className="flex h-full min-h-0 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              {emptyLabel}
            </div>
          )}
        </div>

        {viewAllHref ? (
          <div className="shrink-0 border-t border-border/60 p-2">
            <Button variant="outline" size="sm" className="h-8 w-full" asChild>
              <Link href={viewAllHref}>
                {viewAllLabel}
                {hasMore ? ` (${formatNumberWithSpaces(total)})` : null}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default OperationsItemList
