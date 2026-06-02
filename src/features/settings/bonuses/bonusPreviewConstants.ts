export const PREVIEW_DAY_OPTIONS = [28, 56, 84] as const

export const DEFAULT_PREVIEW_DAYS = 56

export type PreviewDayOption = (typeof PREVIEW_DAY_OPTIONS)[number]
