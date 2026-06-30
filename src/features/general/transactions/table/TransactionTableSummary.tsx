import type { GlobalSettings } from 'gambling-bot-shared/guild'

import { KpiStripMetric } from '@/components/page/KpiStrip'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatOverviewCount,
  formatOverviewCurrency
} from '@/lib/overview/overviewFormatters'
import { ITransactionCounts } from '@/types/types'

const getCashFlowFormula = (counts: ITransactionCounts) => {
  const { deposit, withdraw } = counts.type
  let formula = ''

  if (deposit) formula += 'deposit'
  if (withdraw) formula += formula ? ' - withdraw' : 'withdraw'

  return formula || 'No active types'
}

const getPnLFormula = (counts: ITransactionCounts) => {
  const positiveTypes: (keyof ITransactionCounts['type'])[] = [
    'win',
    'bonus',
    'refund'
  ]
  const negativeTypes: (keyof ITransactionCounts['type'])[] = ['bet', 'vip']

  let formula = ''

  positiveTypes.forEach((t) => {
    if (counts.type[t]) formula += formula ? ` + ${t}` : t
  })

  negativeTypes.forEach((t) => {
    if (counts.type[t]) formula += formula ? ` - ${t}` : t
  })

  return formula || 'No active types'
}

interface SummaryPanelProps {
  globalSettings: GlobalSettings
  cashFlow: number
  gamePnL: number
  counts: ITransactionCounts
}

const TransactionTableSummary = ({
  globalSettings,
  cashFlow,
  gamePnL,
  counts
}: SummaryPanelProps) => {
  const formatCurrency = (value: number) =>
    formatOverviewCurrency(value, globalSettings)
  const activeTypesNote = 'Only active items are counted.'

  const countMetrics = [
    { label: 'Deposits', value: counts.type.deposit },
    { label: 'Withdraws', value: counts.type.withdraw },
    { label: 'Bets', value: counts.type.bet },
    { label: 'Vips', value: counts.type.vip },
    { label: 'Wins', value: counts.type.win },
    { label: 'Bonuses', value: counts.type.bonus },
    { label: 'Refunds', value: counts.type.refund }
  ] as const

  return (
    <Card className="py-4">
      <CardContent>
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
          <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-4 lg:flex-2 lg:grid-cols-2">
            <KpiStripMetric
              label="Cash flow"
              value={cashFlow}
              positiveIsGreen
              formatter={formatCurrency}
              tooltip={`${activeTypesNote} ${getCashFlowFormula(counts)}`}
            />
            <KpiStripMetric
              label="Profit / Loss"
              value={gamePnL}
              positiveIsGreen
              formatter={formatCurrency}
              tooltip={`${activeTypesNote} ${getPnLFormula(counts)}`}
            />
          </div>

          <div
            className="hidden shrink-0 bg-border lg:block lg:w-px"
            aria-hidden
          />

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-4 sm:grid-cols-4 lg:flex-7 lg:grid-cols-7 lg:border-t-0 lg:pt-0">
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

export default TransactionTableSummary
