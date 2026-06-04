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

export function guildDateRangeMatch(
  guildId: string,
  dateFrom: string,
  dateTo: string
): { guildId: string; createdAt: { $gte: Date; $lte: Date } } {
  const from = new Date(dateFrom)
  from.setHours(0, 0, 0, 0)

  const to = new Date(dateTo)
  to.setHours(23, 59, 59, 999)

  return { guildId, createdAt: { $gte: from, $lte: to } }
}
