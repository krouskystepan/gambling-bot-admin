'use client'

import { toast } from 'sonner'

function filenameFromContentDisposition(
  header: string | null
): string | undefined {
  if (!header) return undefined
  const match = /filename="([^"]+)"/.exec(header)
  return match?.[1]
}

export async function downloadCsvFile(
  href: string,
  fallbackFilename: string
): Promise<boolean> {
  try {
    const response = await fetch(href)

    if (!response.ok) {
      const message =
        (await response.text()).trim() || `Export failed (${response.status})`
      toast.error(message)
      return false
    }

    const contentType = response.headers.get('Content-Type') ?? ''
    if (!contentType.includes('text/csv')) {
      const message =
        (await response.text()).trim() ||
        'Export returned an unexpected response'
      toast.error(message)
      return false
    }

    const blob = await response.blob()
    const filename =
      filenameFromContentDisposition(
        response.headers.get('Content-Disposition')
      ) ?? fallbackFilename
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    return true
  } catch {
    toast.error('Export failed')
    return false
  }
}
