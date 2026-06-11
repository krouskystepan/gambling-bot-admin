import type { GlobalSettings } from 'gambling-bot-shared'

import { KpiStripMetric } from '@/components/KpiStrip'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatOverviewCount,
  formatOverviewCurrency
} from '@/lib/overviewFormatters'
import { IAtmRequestCounts } from '@/types/types'

const AtmQueueTableSummary = ({
  counts,
  globalSettings
}: {
  counts: IAtmRequestCounts
  globalSettings: GlobalSettings
}) => {
  const formatCurrency = (value: number) =>
    formatOverviewCurrency(value, globalSettings)

  const countMetrics = [
    { label: 'Pending', value: counts.pending },
    { label: 'Approved', value: counts.approved },
    { label: 'Rejected', value: counts.rejected },
    { label: 'Deposits', value: counts.type.deposit },
    { label: 'Withdraws', value: counts.type.withdraw },
    { label: 'Total', value: counts.total }
  ] as const

  return (
    <Card className="py-4">
      <CardContent>
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
          <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-4 lg:flex-2 lg:grid-cols-2">
            <KpiStripMetric
              label="Pending in"
              value={counts.amount.pendingDeposits}
              positiveIsGreen
              formatter={formatCurrency}
              tooltip="Sum of all pending deposit request amounts."
            />
            <KpiStripMetric
              label="Pending out"
              value={counts.amount.pendingWithdraws}
              formatter={formatCurrency}
              tooltip="Sum of all pending withdrawal request amounts."
            />
          </div>

          <div
            className="hidden shrink-0 bg-border lg:block lg:w-px"
            aria-hidden
          />

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-4 sm:grid-cols-3 lg:flex-6 lg:grid-cols-6 lg:border-t-0 lg:pt-0">
            {countMetrics.map(({ label, value }) => (
              <KpiStripMetric
                key={label}
                label={label}
                value={value}
                formatter={formatOverviewCount}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AtmQueueTableSummary
