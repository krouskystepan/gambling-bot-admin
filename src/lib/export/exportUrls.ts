export type ReportExportKind =
  | 'pnl-by-source'
  | 'tax-summary-guild'
  | 'tax-summary-staff'

export function buildTransactionExportUrl(
  guildId: string,
  search: string
): string {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search
  )
  params.delete('page')
  params.delete('limit')
  params.delete('view')
  const query = params.toString()
  return `/api/guilds/${guildId}/export/transactions${query ? `?${query}` : ''}`
}

export function buildStaffActionsExportUrl(
  guildId: string,
  search: string
): string {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search
  )
  params.delete('page')
  params.delete('limit')
  const query = params.toString()
  return `/api/guilds/${guildId}/export/staff-actions${query ? `?${query}` : ''}`
}

export function buildReportExportUrl(
  guildId: string,
  kind: ReportExportKind,
  dateFrom: string,
  dateTo: string
): string {
  const params = new URLSearchParams({ dateFrom, dateTo })
  return `/api/guilds/${guildId}/export/${kind}?${params.toString()}`
}
