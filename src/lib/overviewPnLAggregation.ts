import type { OverviewPnLGranularity } from '@/features/general/overview/period'
import { cashFlowSum, gamePnLSum } from '@/lib/transactionTotals'

export function buildPnLTimeGroupStage(
  timezone: string,
  granularity: OverviewPnLGranularity
) {
  const format = granularity === 'hour' ? '%Y-%m-%dT%H:00' : '%Y-%m-%d'

  return {
    $group: {
      _id: {
        $dateToString: {
          format,
          date: '$createdAt',
          timezone
        }
      },
      gamePnL: gamePnLSum,
      cashFlow: cashFlowSum,
      txCount: { $sum: 1 }
    }
  }
}
