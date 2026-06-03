import { CircleQuestionMark } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatOverviewCount } from '@/lib/overviewFormatters'

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
      <Label className="inline-flex items-center gap-1 text-sm text-muted-foreground">
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

/** Single-row KPI bar; equal columns, scrolls horizontally when space is tight. */
const KpiStrip = ({ items }: KpiStripProps) => {
  return (
    <Card className="py-4">
      <CardContent className="overflow-x-auto">
        <div
          className="grid w-full gap-x-6"
          style={{
            gridTemplateColumns: `repeat(${items.length}, minmax(6.5rem, 1fr))`
          }}
        >
          {items.map((item) => (
            <KpiStripMetric key={item.label} {...item} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default KpiStrip
