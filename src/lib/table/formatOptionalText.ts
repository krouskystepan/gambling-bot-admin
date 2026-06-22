export function formatOptionalText(
  value: string | null | undefined,
  fallback = '-'
): string {
  const trimmed = value?.trim()

  return trimmed || fallback
}
