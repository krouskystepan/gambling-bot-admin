import { CircleQuestionMark } from 'lucide-react'

import type { CSSProperties } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatOverviewCount } from '@/lib/overview/overviewFormatters'

export type KpiStripItem = {
  label: string
  value: number
  positiveIsGreen?: boolean
  tooltip?: string
  formatter?: (value: number) => string
}

type KpiStripProps = {
  items: KpiStripItem[]
}

export const KpiStripMetric = ({
  label,
  value,
  positiveIsGreen = false,
  tooltip,
  formatter = formatOverviewCount
}: KpiStripItem) => {
  const colorClass = positiveIsGreen
    ? value >= 0
      ? 'text-green-600'
      : 'text-red-600'
    : 'text-foreground'

  return (
    <div className="min-w-0">
      <Label className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
        {label}
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleQuestionMark
                size={16}
                className="cursor-pointer text-muted-foreground"
              />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : null}
      </Label>
      <div className={`text-lg font-bold ${colorClass}`}>
        {formatter(value)}
      </div>
    </div>
  )
}

/** Single-row KPI bar with equal-width columns across the full card width. */
const KpiStrip = ({ items }: KpiStripProps) => {
  return (
    <Card className="py-4">
      <CardContent>
        <div
          className="grid w-full gap-x-6 gap-y-4 max-sm:grid-cols-2 sm:max-lg:grid-cols-3 lg:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]"
          style={{ '--kpi-cols': items.length } as CSSProperties}
        >
          {items.map((item) => (
            <div key={item.label} className="min-w-0">
              <KpiStripMetric {...item} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default KpiStrip
