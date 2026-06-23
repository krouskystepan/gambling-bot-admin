export function parseAtmQueueFilterStatus(filterStatus?: string): string[] {
  if (filterStatus === undefined) return ['pending']
  if (filterStatus === 'all') return []
  return filterStatus.split(',').filter(Boolean)
}

export function parseAtmQueueFilterStatusForTable(
  filterStatusParam: string | null
): string[] | undefined {
  if (filterStatusParam === null) return ['pending']
  if (filterStatusParam === 'all') return undefined

  const parsed = filterStatusParam.split(',').filter(Boolean)
  return parsed.length ? parsed : undefined
}

export function serializeAtmQueueFilterStatus(
  statusValues: string[] | undefined
): string {
  if (!statusValues?.length) return 'all'
  return statusValues.join(',')
}
