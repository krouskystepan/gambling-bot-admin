'use client'

import { CircleQuestionMark } from 'lucide-react'

import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  formatNumberToReadableString,
  formatNumberWithSpaces
} from '@/lib/utils'
import { ITransactionCounts } from '@/types/types'

const getCashFlowFormula = (counts: ITransactionCounts) => {
  const deposit = Number(counts.type.deposit ?? 0)
  const withdraw = Number(counts.type.withdraw ?? 0)

  let formula = ''
  if (deposit !== 0) formula += 'deposit'
  if (withdraw !== 0) formula += formula ? ' - withdraw' : 'withdraw'

  return formula || 'No active types'
}

const getPnLFormula = (counts: ITransactionCounts) => {
  const positive: (keyof ITransactionCounts['type'])[] = [
    'win',
    'bonus',
    'refund'
  ]
  const negative: (keyof ITransactionCounts['type'])[] = ['bet', 'vip']

  let formula = ''

  positive.forEach((t) => {
    if (Number(counts.type[t] ?? 0) !== 0) formula += formula ? ` + ${t}` : t
  })

  negative.forEach((t) => {
    if (Number(counts.type[t] ?? 0) !== 0) formula += formula ? ` - ${t}` : t
  })

  return formula || 'No active types'
}

interface SummaryPanelProps {
  cashFlow: number
  gamePnL: number
  counts: ITransactionCounts
}

const TransactionTableSummary = ({
  cashFlow,
  gamePnL,
  counts
}: SummaryPanelProps) => {
  const formatCurrency = (value: number) => {
    const roundedValue = Math.round(Number(value ?? 0))
    const base = formatNumberWithSpaces(Math.abs(roundedValue))
    return roundedValue < 0 ? `-$${base}` : `$${base}`
  }

  return (
    <section className="mt-4 flex h-fit flex-wrap justify-center gap-8 rounded-md border p-4">
      <SummaryItem
        label="Cash Flow"
        value={Number(cashFlow ?? 0)}
        formatter={formatCurrency}
        positiveIsGreen
        tooltip={getCashFlowFormula(counts)}
      />
      <SummaryItem
        label="Profit / Loss"
        value={Number(gamePnL ?? 0)}
        formatter={formatCurrency}
        positiveIsGreen
        tooltip={getPnLFormula(counts)}
      />

      <SummaryItem
        label="Deposits"
        value={Number(counts.type.deposit ?? 0)}
        formatter={formatNumberToReadableString}
      />
      <SummaryItem
        label="Withdraws"
        value={Number(counts.type.withdraw ?? 0)}
        formatter={formatNumberToReadableString}
      />
      <SummaryItem
        label="Bets"
        value={Number(counts.type.bet ?? 0)}
        formatter={formatNumberToReadableString}
      />
      <SummaryItem
        label="Vips"
        value={Number(counts.type.vip ?? 0)}
        formatter={formatNumberToReadableString}
      />
      <SummaryItem
        label="Wins"
        value={Number(counts.type.win ?? 0)}
        formatter={formatNumberToReadableString}
      />
      <SummaryItem
        label="Bonuses"
        value={Number(counts.type.bonus ?? 0)}
        formatter={formatNumberToReadableString}
      />
      <SummaryItem
        label="Refunds"
        value={Number(counts.type.refund ?? 0)}
        formatter={formatNumberToReadableString}
      />
    </section>
  )
}

interface SummaryItemProps {
  label: string
  value: number
  positiveIsGreen?: boolean
  tooltip?: string
  formatter?: (value: number) => React.ReactNode
}

const SummaryItem = ({
  label,
  value,
  positiveIsGreen = false,
  tooltip = undefined,
  formatter
}: SummaryItemProps) => {
  const colorClass = positiveIsGreen
    ? value >= 0
      ? 'text-green-600'
      : 'text-red-600'
    : 'text-white'

  const displayValue = formatter ? formatter(value) : value

  return (
    <div>
      <Label className="inline-flex items-center gap-1 text-sm text-gray-500">
        {label}
        {tooltip ? (
          <Tooltip key={tooltip}>
            <TooltipTrigger asChild>
              <CircleQuestionMark
                size={16}
                className="cursor-pointer text-gray-500"
              />
            </TooltipTrigger>
            <TooltipContent className="flex max-w-sm flex-col">
              <span className="font-semibold">
                Only active items are counted.
              </span>
              <span>{tooltip}</span>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </Label>
      <div className={`text-lg font-bold ${colorClass}`}>{displayValue}</div>
    </div>
  )
}

export default TransactionTableSummary
