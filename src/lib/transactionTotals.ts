export const gamePnLSum = {
  $sum: {
    $switch: {
      branches: [
        { case: { $in: ['$type', ['bet', 'vip']] }, then: '$amount' },
        {
          case: { $in: ['$type', ['win', 'bonus', 'refund']] },
          then: { $multiply: ['$amount', -1] }
        }
      ],
      default: 0
    }
  }
} as const

export const cashFlowSum = {
  $sum: {
    $switch: {
      branches: [
        { case: { $eq: ['$type', 'deposit'] }, then: '$amount' },
        {
          case: { $eq: ['$type', 'withdraw'] },
          then: { $multiply: ['$amount', -1] }
        }
      ],
      default: 0
    }
  }
} as const

export const periodTotalsGroup = {
  $group: {
    _id: null,
    gamePnL: gamePnLSum,
    cashFlow: cashFlowSum,
    txCount: { $sum: 1 }
  }
} as const

export const betVolumeSum = {
  $sum: { $cond: [{ $eq: ['$type', 'bet'] }, '$amount', 0] }
} as const

export const winVolumeSum = {
  $sum: { $cond: [{ $eq: ['$type', 'win'] }, '$amount', 0] }
} as const

export const depositVolumeSum = {
  $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] }
} as const

export const withdrawVolumeSum = {
  $sum: { $cond: [{ $eq: ['$type', 'withdraw'] }, '$amount', 0] }
} as const

export const reportMetricsGroupFields = {
  gamePnL: gamePnLSum,
  cashFlow: cashFlowSum,
  betVolume: betVolumeSum,
  winVolume: winVolumeSum,
  depositVolume: depositVolumeSum,
  withdrawVolume: withdrawVolumeSum,
  txCount: { $sum: 1 }
} as const

export const sourcePnLGroupStage = {
  $group: {
    _id: '$source',
    ...reportMetricsGroupFields
  }
} as const

export type ReportTaxGranularity = 'hour' | 'day' | 'month'

export function getTaxPeriodMongoFormat(
  granularity: ReportTaxGranularity
): string {
  switch (granularity) {
    case 'hour':
      return '%Y-%m-%dT%H:00'
    case 'day':
      return '%Y-%m-%d'
    case 'month':
      return '%Y-%m'
  }
}

export function buildTaxPeriodGroupStage(
  timezone: string,
  granularity: ReportTaxGranularity
) {
  return {
    $group: {
      _id: {
        $dateToString: {
          format: getTaxPeriodMongoFormat(granularity),
          date: '$createdAt',
          timezone
        }
      },
      ...reportMetricsGroupFields
    }
  }
}

export function buildStaffTaxPeriodGroupStage(
  timezone: string,
  granularity: ReportTaxGranularity
) {
  const format = getTaxPeriodMongoFormat(granularity)
  return {
    $group: {
      _id: {
        period: {
          $dateToString: {
            format,
            date: '$createdAt',
            timezone
          }
        },
        handlerId: '$handledBy'
      },
      ...reportMetricsGroupFields
    }
  }
}

export const netProfitSum = {
  $sum: {
    $switch: {
      branches: [
        {
          case: { $eq: ['$type', 'bet'] },
          then: { $multiply: ['$amount', -1] }
        },
        {
          case: { $in: ['$type', ['win', 'bonus']] },
          then: '$amount'
        }
      ],
      default: 0
    }
  }
} as const

export { guildDateRangeMatch } from './guildTimezone'
