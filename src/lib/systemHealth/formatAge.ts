import { DAY_MS, HOUR_MS, MINUTE_MS } from '@/lib/time/durations'

export const formatAgeMs = (ageMs: number) => {
  if (ageMs < MINUTE_MS) return 'just now'
  if (ageMs < HOUR_MS) {
    const minutes = Math.floor(ageMs / MINUTE_MS)
    return `${minutes}m ago`
  }
  if (ageMs < DAY_MS) {
    const hours = Math.floor(ageMs / HOUR_MS)
    return `${hours}h ago`
  }
  const days = Math.floor(ageMs / DAY_MS)
  return `${days}d ago`
}

export const formatStaleAge = (ageMs: number) => {
  if (ageMs < DAY_MS) return formatAgeMs(ageMs)
  const days = Math.floor(ageMs / DAY_MS)
  return `Stale ${days}d`
}
