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
}

const rowClassName =
  'inline-flex w-fit max-w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm leading-snug text-foreground'

const StatusIcon = ({ severity }: { severity: SystemHealthSeverity }) => {
  if (severity === 'ok') {
    return <CheckCircle2 size={16} className="shrink-0 text-green-600" />
  }
  if (severity === 'warning') {
    return <TriangleAlert size={16} className="shrink-0 text-brand" />
  }
  return <XCircle size={16} className="shrink-0 text-destructive" />
}

const HealthRow = ({ row }: { row: SystemHealthRow }) => {
  const label = `${row.label} (${row.count.toLocaleString()})`
  const content = (
    <>
      <StatusIcon severity={row.severity} />
      <span>{label}</span>
    </>
  )

  const rowNode =
    row.href && row.severity !== 'ok' ? (
      <Link
        href={row.href}
        className={cn(rowClassName, 'transition-colors hover:bg-accent/50')}
      >
        {content}
      </Link>
    ) : (
      <div className={rowClassName}>{content}</div>
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
  items
}: OperationsCategorySectionProps) => {
  const issues = rows.filter((row) => row.severity !== 'ok')

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold leading-none">{title}</h4>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {issues.length === 0
            ? description
            : `${issues.length} signal${issues.length === 1 ? '' : 's'} need attention`}
        </p>
      </div>
      <div className="flex flex-col gap-0.5">
        {rows.map((row) => (
          <HealthRow key={row.id} row={row} />
        ))}
      </div>
      {items.length > 0 ? <OperationsItemList items={items} /> : null}
    </div>
  )
}

export default OperationsCategorySection
