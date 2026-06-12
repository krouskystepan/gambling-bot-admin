import type { OverviewDateRange } from '@/features/general/overview/period'

export function parseReportExportParams(
  searchParams: URLSearchParams
): OverviewDateRange | null {
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  if (!dateFrom || !dateTo) return null
  return { dateFrom, dateTo }
}
