export function formatModerationWhen(value: Date | string) {
  return new Date(value).toLocaleString('cs', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
