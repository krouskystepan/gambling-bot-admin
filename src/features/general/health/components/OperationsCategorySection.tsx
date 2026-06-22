import { formatNumberWithSpaces } from 'gambling-bot-shared/common'
import { CheckCircle2, TriangleAlert, XCircle } from 'lucide-react'

import Link from 'next/link'

import type {
  SystemHealthRow,
  SystemHealthSeverity
} from '@/actions/database/systemHealth.action'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import OperationsItemList from './OperationsItemList'
import type { OperationsItemListProps } from './OperationsItemList'

type OperationsCategorySectionProps = {
  title: string
  description: string
  rows: SystemHealthRow[]
  items: OperationsItemListProps['items']
  itemTotal?: number
  viewAllHref?: string
  viewAllLabel?: string
  emptyLabel?: string
}

const StatusIcon = ({ severity }: { severity: SystemHealthSeverity }) => {
  if (severity === 'ok') {
    return <CheckCircle2 size={15} className="shrink-0 text-green-600" />
  }
  if (severity === 'warning') {
    return <TriangleAlert size={15} className="shrink-0 text-brand" />
  }
  return <XCircle size={15} className="shrink-0 text-destructive" />
}

const HealthRow = ({ row }: { row: SystemHealthRow }) => {
  const label = `${row.label} (${formatNumberWithSpaces(row.count)})`
  const content = (
    <>
      <StatusIcon severity={row.severity} />
      <span className="truncate">{label}</span>
    </>
  )

  const rowClassName = cn(
    'flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm leading-snug',
    row.severity !== 'ok' && 'font-medium'
  )

  const rowNode =
    row.href && row.severity !== 'ok' ? (
      <Link
        href={row.href}
        className={cn(
          rowClassName,
          'text-foreground transition-colors hover:bg-accent/50'
        )}
      >
        {content}
      </Link>
    ) : (
      <div className={cn(rowClassName, 'text-muted-foreground')}>{content}</div>
    )

  if (!row.tooltip) return rowNode

  return (
    <Tooltip>
      <TooltipTrigger asChild>{rowNode}</TooltipTrigger>
      <TooltipContent>{row.tooltip}</TooltipContent>
    </Tooltip>
  )
}

const OperationsCategorySection = ({
  title,
  description,
  rows,
  items,
  itemTotal,
  viewAllHref,
  viewAllLabel,
  emptyLabel
}: OperationsCategorySectionProps) => {
  const issues = rows.filter((row) => row.severity !== 'ok')

  return (
    <div className="grid grid-rows-[auto_auto_minmax(0,24rem)] rounded-lg border border-border/60 bg-muted/10 p-3 xl:row-span-3 xl:grid-rows-subgrid">
      <div>
        <h4 className="font-semibold leading-none">{title}</h4>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {issues.length === 0
            ? description
            : `${issues.length} signal${issues.length === 1 ? '' : 's'} need attention`}
        </p>
      </div>

      <div className="mt-3 space-y-0.5">
        {rows.map((row) => (
          <HealthRow key={row.id} row={row} />
        ))}
      </div>

      <div className="flex min-h-0 flex-col">
        <OperationsItemList
          items={items}
          totalCount={itemTotal}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          emptyLabel={emptyLabel}
        />
      </div>
    </div>
  )
}

export default OperationsCategorySection
