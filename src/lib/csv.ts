export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsvRow(
  values: (string | number | null | undefined)[]
): string {
  return values
    .map((value) => {
      if (value === null || value === undefined) return ''
      return escapeCsvField(String(value))
    })
    .join(',')
}

export function toCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const lines = [toCsvRow(headers), ...rows.map((row) => toCsvRow(row))]
  return `${lines.join('\n')}\n`
}
