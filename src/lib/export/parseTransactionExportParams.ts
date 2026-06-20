import type { TransactionExportFilters } from '@/lib/export/transactionExport'

export function parseTransactionExportParams(
  searchParams: URLSearchParams
): TransactionExportFilters {
  return {
    search: searchParams.get('search') ?? undefined,
    staffId: searchParams.get('staffId') ?? undefined,
    referenceId:
      searchParams.get('referenceId') ??
      searchParams.get('betId') ??
      searchParams.get('adminSearch') ??
      undefined,
    filterType:
      searchParams.get('filterType')?.split(',').filter(Boolean) ?? undefined,
    filterSource:
      searchParams.get('filterSource')?.split(',').filter(Boolean) ?? undefined,
    filterCasinoGame:
      searchParams.get('filterCasinoGame')?.split(',').filter(Boolean) ??
      undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    userId: searchParams.get('userId') ?? undefined
  }
}
