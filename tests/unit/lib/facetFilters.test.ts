import { describe, expect, it } from 'vitest'

import {
  canSelectFacetValue,
  filterMembersByEntityFacet,
  getVisibleFacetOptions,
  isEntityCompatibleWithFacet,
  pruneFacetValues
} from '@/lib/table/facetFilters'

describe('facetFilters branch coverage', () => {
  const options = [
    { value: 'a', label: 'A', realValue: 'a' as const },
    { value: 'b', label: 'B', realValue: 'b' as const },
    { value: 'c', label: 'C', realValue: 'c' as const }
  ]

  it('getVisibleFacetOptions keeps selected zero-count and drops unselected zero-count', () => {
    expect(
      getVisibleFacetOptions(options, [options[1]], { a: 0, b: 0, c: 2 })
    ).toEqual([options[1], options[2]])
    expect(getVisibleFacetOptions(options, [], { a: 0, b: 0, c: 0 })).toEqual(
      []
    )
    expect(getVisibleFacetOptions(options, [], { a: 1, b: 1, c: 1 })).toEqual(
      options
    )
    expect(
      getVisibleFacetOptions(options, [], { c: 2 } as Record<
        'a' | 'b' | 'c',
        number
      >)
    ).toEqual([options[2]])
  })

  it('pruneFacetValues returns undefined for empty input or empty prune', () => {
    expect(pruneFacetValues([], { a: 1 })).toBeUndefined()
    expect(pruneFacetValues(['a'], { a: 0 })).toBeUndefined()
    expect(pruneFacetValues(['a', 'b'], { a: 1, b: 1 })).toEqual(['a', 'b'])
    expect(pruneFacetValues(['a'], { a: 2 })).toEqual(['a'])
    expect(pruneFacetValues(['missing' as 'a'], { a: 1 })).toBeUndefined()
  })

  it('canSelectFacetValue handles missing counts', () => {
    expect(canSelectFacetValue('missing' as 'a', { a: 1 })).toBe(false)
    expect(canSelectFacetValue('a', { a: 2 })).toBe(true)
  })

  it('filterMembersByEntityFacet handles restrict and selected user', () => {
    const members = [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }]

    expect(filterMembersByEntityFacet(members, 'u2', {}, false)).toEqual(
      members
    )
    expect(
      filterMembersByEntityFacet(members, 'u2', { u1: 0, u2: 0, u3: 1 }, true)
    ).toEqual([{ userId: 'u2' }, { userId: 'u3' }])
    expect(
      filterMembersByEntityFacet(members, 'u2', { u1: 0, u3: 0 }, true)
    ).toEqual([{ userId: 'u2' }])
  })

  it('isEntityCompatibleWithFacet returns true when counts are positive', () => {
    expect(isEntityCompatibleWithFacet('u1', { u1: 2 }, true)).toBe(true)
    expect(isEntityCompatibleWithFacet('u1', {}, true)).toBe(false)
  })

  it('filterMembersByEntityFacet handles undefined selected user under restrict', () => {
    expect(
      filterMembersByEntityFacet(
        [{ userId: 'u1' }, { userId: 'u2' }],
        undefined,
        { u2: 1 },
        true
      )
    ).toEqual([{ userId: 'u2' }])
  })
})
