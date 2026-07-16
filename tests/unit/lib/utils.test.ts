import { describe, expect, it } from 'vitest'

import {
  SELECT_NONE_VALUE,
  fromSelectValue,
  toSelectValue
} from '@/lib/optionalSelect'
import { cn, escapeRegExp, parseSortingFromUrl } from '@/lib/utils'

describe('utils', () => {
  it('cn merges class names', () => {
    expect(cn('px-2', 'px-4', false && 'hidden')).toBe('px-4')
  })

  it('escapeRegExp escapes regex metacharacters', () => {
    expect(escapeRegExp('a+b?')).toBe('a\\+b\\?')
  })

  it('parseSortingFromUrl handles null and sort entries', () => {
    expect(parseSortingFromUrl(null)).toEqual([])
    expect(parseSortingFromUrl('amount:desc,createdAt:asc')).toEqual([
      { id: 'amount', desc: true },
      { id: 'createdAt', desc: false }
    ])
  })
})

describe('optionalSelect', () => {
  it('round-trips sentinel and empty values', () => {
    expect(toSelectValue(undefined)).toBe(SELECT_NONE_VALUE)
    expect(toSelectValue('staff-1')).toBe('staff-1')
    expect(fromSelectValue(SELECT_NONE_VALUE)).toBe('')
    expect(fromSelectValue('staff-1')).toBe('staff-1')
  })
})
