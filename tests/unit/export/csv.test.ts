import { describe, expect, it } from 'vitest'

import { escapeCsvField, toCsv, toCsvRow } from '@/lib/export/csv'

describe('escapeCsvField', () => {
  it('returns plain values unchanged', () => {
    expect(escapeCsvField('hello')).toBe('hello')
  })

  it('quotes values containing commas, quotes, or newlines', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"')
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvField('line\nbreak')).toBe('"line\nbreak"')
    expect(escapeCsvField('line\rbreak')).toBe('"line\rbreak"')
  })
})

describe('toCsvRow / toCsv', () => {
  it('maps null and undefined to empty fields', () => {
    expect(toCsvRow(['a', null, undefined, 2])).toBe('a,,,2')
  })

  it('builds a CSV with headers, rows, and trailing newline', () => {
    expect(
      toCsv(
        ['name', 'amount'],
        [
          ['alice', 10],
          ['bob,jr', 20]
        ]
      )
    ).toBe('name,amount\nalice,10\n"bob,jr",20\n')
  })
})
