const SKIPS_CASINO_RTP_CHECK = new Set([
  'blackjack',
  'prediction',
  'winAnnouncements'
])

export const skipsCasinoRtpCheck = (game: string) =>
  SKIPS_CASINO_RTP_CHECK.has(game)

export const isRtpOutOfRange = (value: number) => value >= 100 || value <= 90

export const hasRtpWarning = (
  rtp: number | Record<string, number> | null | undefined
): boolean => {
  if (rtp == null) return false
  if (typeof rtp === 'number') return isRtpOutOfRange(rtp)
  return Object.values(rtp).some(isRtpOutOfRange)
}

export type RtpStatus = 'hidden' | 'ok' | 'high' | 'low'

export const getRtpStatus = (
  rtp: number | Record<string, number> | null | undefined,
  hidden: boolean
): RtpStatus => {
  if (hidden || rtp == null) return 'hidden'

  const values = typeof rtp === 'number' ? [rtp] : Object.values(rtp)
  if (values.some((value) => value >= 100)) return 'high'
  if (values.some((value) => value <= 90)) return 'low'
  return 'ok'
}
