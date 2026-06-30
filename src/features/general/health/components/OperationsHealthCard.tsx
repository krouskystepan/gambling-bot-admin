import type { CSSProperties } from 'react'

import type { SystemHealthData } from '@/actions/database/systemHealth.action'
import { KpiStripMetric } from '@/components/page/KpiStrip'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import OperationsCategorySection from './OperationsCategorySection'

type OperationsHealthCardProps = {
  guildId: string
  operations: SystemHealthData
}

const OperationsHealthCard = ({
  guildId,
  operations
}: OperationsHealthCardProps) => {
  const { summary, atm, blackjack, predictions } = operations

  const summaryItems = [
    {
      label: 'Needs attention',
      value: summary.needsAttention,
      tooltip:
        'Active issues requiring staff action across ATM, blackjack, and predictions'
    },
    {
      label: 'Pending ATM',
      value: summary.pendingAtm,
      tooltip: 'Deposit and withdraw requests awaiting approval'
    },
    {
      label: 'Stale blackjack',
      value: summary.staleBlackjack,
      tooltip: 'Blackjack games with no update for 24+ hours'
    },
    {
      label: 'Predictions awaiting action',
      value: summary.predictionsAwaitingAction,
      tooltip:
        'Overdue autolock, ended awaiting payout, or stuck in paying status'
    }
  ]

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="pb-0">
        <CardTitle>Operations</CardTitle>
        <CardDescription>
          {summary.needsAttention === 0
            ? 'Runtime status for ATM, blackjack, and predictions looks good.'
            : `${summary.needsAttention} item${summary.needsAttention === 1 ? '' : 's'} need attention across runtime subsystems.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div
          className="grid w-full gap-x-6 gap-y-4 max-sm:grid-cols-2 lg:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]"
          style={{ '--kpi-cols': summaryItems.length } as CSSProperties}
        >
          {summaryItems.map((item) => (
            <KpiStripMetric key={item.label} {...item} />
          ))}
        </div>

        <div className="border-t border-border pt-6">
          <div className="grid gap-4 xl:grid-cols-3 xl:grid-rows-[auto_auto_minmax(0,24rem)]">
            <OperationsCategorySection
              title="ATM"
              description="No pending deposit or withdraw requests."
              rows={atm.rows}
              items={atm.items}
              itemTotal={summary.pendingAtm}
              viewAllHref={`/dashboard/g/${guildId}/atm-queue?filterStatus=pending`}
              viewAllLabel="Open ATM queue"
              emptyLabel="No pending requests"
            />
            <OperationsCategorySection
              title="Blackjack"
              description="No stale in-progress games."
              rows={blackjack.rows}
              items={blackjack.items}
              itemTotal={
                summary.staleBlackjack > 0 ? summary.staleBlackjack : undefined
              }
              emptyLabel="No stale in-progress games"
            />
            <OperationsCategorySection
              title="Predictions"
              description="No predictions awaiting staff action."
              rows={predictions.rows}
              items={predictions.items}
              itemTotal={summary.predictionsAwaitingAction}
              viewAllHref={`/dashboard/g/${guildId}/predictions`}
              viewAllLabel="Open predictions"
              emptyLabel="No predictions awaiting action"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OperationsHealthCard
