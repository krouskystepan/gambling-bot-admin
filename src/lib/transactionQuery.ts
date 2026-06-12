import { guildDateRangeMatch } from '@/lib/guildTimezone'
import {
  type TransactionFilter,
  buildTransactionMatchFilters,
  buildTransactionQuery
} from '@/lib/transactionFilters'

export type TransactionQueryFilters = {
  userId?: string
  search?: string
  adminSearch?: string
  filterType?: string[]
  filterSource?: string[]
  filterCasinoGame?: string[]
  dateFrom?: string
  dateTo?: string
}

export function buildTransactionMatch(
  guildId: string,
  filters: TransactionQueryFilters,
  timezone?: string | null
): TransactionFilter {
  const { dateFrom, dateTo, ...rest } = filters
  const andFilters = buildTransactionMatchFilters(rest)

  if (dateFrom && dateTo) {
    const { createdAt } = guildDateRangeMatch(
      guildId,
      dateFrom,
      dateTo,
      timezone
    )
    andFilters.push({ createdAt })
  }

  return buildTransactionQuery(guildId, andFilters)
}
