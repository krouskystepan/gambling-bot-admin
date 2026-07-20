import { describe, expect, it } from 'vitest'

import {
  diffSettingsPaths,
  getValueAtPath
} from '@/lib/settingsAudit/diffSettingsPaths'

describe('diffSettingsPaths', () => {
  it('returns empty when values are equal', () => {
    expect(diffSettingsPaths({ a: 1 }, { a: 1 })).toEqual([])
    expect(diffSettingsPaths(null, null)).toEqual([])
  })

  it('skips insert when both sides stringify equal (nested)', () => {
    const before = { nested: { x: 1, y: [1, 2] } }
    const after = { nested: { x: 1, y: [1, 2] } }
    expect(diffSettingsPaths(before, after)).toEqual([])
  })

  it('lists leaf paths that changed', () => {
    expect(
      diffSettingsPaths(
        { a: 1, nested: { b: 2, c: 3 } },
        { a: 1, nested: { b: 9, c: 3 } }
      )
    ).toEqual(['nested.b'])
  })

  it('lists added and removed keys', () => {
    expect(diffSettingsPaths({ a: 1 }, { a: 1, b: 2 })).toEqual(['b'])
    expect(diffSettingsPaths({ a: 1, b: 2 }, { a: 1 })).toEqual(['b'])
  })

  it('walks removed nested objects', () => {
    expect(diffSettingsPaths({ nested: { a: 1, b: 2 } }, {})).toEqual([
      'nested.a',
      'nested.b'
    ])
  })

  it('treats arrays as leaf values', () => {
    expect(diffSettingsPaths({ ids: ['1'] }, { ids: ['1', '2'] })).toEqual([
      'ids'
    ])
  })

  it('walks newly added nested objects', () => {
    expect(diffSettingsPaths({}, { nested: { a: 1, b: 2 } })).toEqual([
      'nested.a',
      'nested.b'
    ])
  })

  it('returns root path when replacing non-object with object', () => {
    expect(diffSettingsPaths(1, { a: 1 })).toEqual([''])
  })

  it('compares object vs leaf at the same path', () => {
    expect(diffSettingsPaths({ a: { b: 1 } }, { a: 2 })).toEqual(['a'])
    expect(diffSettingsPaths({ a: 2 }, { a: { b: 1 } })).toEqual(['a'])
  })

  it('walks when a key is null on one side', () => {
    expect(diffSettingsPaths({ a: null }, { a: { b: 1 } })).toEqual(['a.b'])
    expect(diffSettingsPaths({ a: { b: 1 } }, { a: null })).toEqual(['a.b'])
  })
})

describe('getValueAtPath', () => {
  it('reads nested values', () => {
    expect(getValueAtPath({ a: { b: 3 } }, 'a.b')).toBe(3)
    expect(getValueAtPath({ a: { b: 3 } }, 'a.c')).toBeUndefined()
    expect(getValueAtPath({ a: 1 }, '')).toEqual({ a: 1 })
  })
})
