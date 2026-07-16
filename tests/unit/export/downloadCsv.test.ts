import { beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadCsvFile } from '@/lib/export/downloadCsv'

const { toastError } = vi.hoisted(() => ({
  toastError: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: { error: toastError }
}))

describe('downloadCsvFile', () => {
  const click = vi.fn()
  let anchor: { href: string; download: string; click: typeof click }

  beforeEach(() => {
    vi.clearAllMocks()
    anchor = { href: '', download: '', click }
    vi.stubGlobal('document', {
      createElement: vi.fn(() => anchor)
    })
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:export'),
      revokeObjectURL: vi.fn()
    })
  })

  it('downloads csv and uses Content-Disposition filename', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'Content-Type'
              ? 'text/csv; charset=utf-8'
              : 'attachment; filename="export.csv"'
        },
        blob: () => Promise.resolve(new Blob(['a,b\n']))
      })
    )

    await expect(downloadCsvFile('/api/export', 'fallback.csv')).resolves.toBe(
      true
    )

    expect(click).toHaveBeenCalled()
    expect(anchor.download).toBe('export.csv')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:export')
  })

  it('falls back to provided filename when Content-Disposition is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name === 'Content-Type' ? 'text/csv' : null)
        },
        blob: () => Promise.resolve(new Blob(['x']))
      })
    )

    await expect(downloadCsvFile('/api/export', 'fallback.csv')).resolves.toBe(
      true
    )
    expect(anchor.download).toBe('fallback.csv')
  })

  it('shows error when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden')
      })
    )

    await expect(downloadCsvFile('/api/export', 'fallback.csv')).resolves.toBe(
      false
    )
    expect(toastError).toHaveBeenCalledWith('Forbidden')
  })

  it('uses status fallback when error body is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('   ')
      })
    )

    await expect(downloadCsvFile('/api/export', 'fallback.csv')).resolves.toBe(
      false
    )
    expect(toastError).toHaveBeenCalledWith('Export failed (500)')
  })

  it('rejects non-csv content types', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'Content-Type' ? 'application/json' : null
        },
        text: () => Promise.resolve('{"error":"nope"}')
      })
    )

    await expect(downloadCsvFile('/api/export', 'fallback.csv')).resolves.toBe(
      false
    )
    expect(toastError).toHaveBeenCalledWith('{"error":"nope"}')
  })

  it('rejects responses with missing content type', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => null
        },
        text: () => Promise.resolve('plain')
      })
    )

    await expect(downloadCsvFile('/api/export', 'fallback.csv')).resolves.toBe(
      false
    )
  })

  it('uses default message for empty content type responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => ''
        },
        text: () => Promise.resolve('plain')
      })
    )

    await expect(downloadCsvFile('/api/export', 'fallback.csv')).resolves.toBe(
      false
    )
    expect(toastError).toHaveBeenCalledWith('plain')
  })

  it('uses default message for unexpected non-csv responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/plain'
        },
        text: () => Promise.resolve('')
      })
    )

    await expect(downloadCsvFile('/api/export', 'fallback.csv')).resolves.toBe(
      false
    )
    expect(toastError).toHaveBeenCalledWith(
      'Export returned an unexpected response'
    )
  })

  it('handles fetch failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))

    await expect(downloadCsvFile('/api/export', 'fallback.csv')).resolves.toBe(
      false
    )
    expect(toastError).toHaveBeenCalledWith('Export failed')
  })
})
