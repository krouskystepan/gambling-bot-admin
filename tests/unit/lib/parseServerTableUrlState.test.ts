import { describe, expect, it } from 'vitest'

import {
  getLeafColumnIds,
  parseServerTableUrlState
} from '@/lib/table/parseServerTableUrlState'

describe('parseServerTableUrlState branches', () => {
  it('uses default visibility when view param is absent', () => {
    const parsed = parseServerTableUrlState(
      new URLSearchParams('sort=amount:asc'),
      {
        columnIds: ['amount', 'user'],
        defaultVisibility: { amount: false, user: true }
      }
    )

    expect(parsed.sorting).toEqual([{ id: 'amount', desc: false }])
    expect(parsed.columnVisibility).toEqual({ amount: false, user: true })
  })

  it('parses state without custom filters', () => {
    const parsed = parseServerTableUrlState(new URLSearchParams(), {
      columnIds: ['amount']
    })
    expect(parsed.columnFilters).toEqual([])
  })

  it('skips nested groups without leaf ids and handles empty sort', () => {
    expect(
      getLeafColumnIds([{ header: 'noop' } as never, { accessorKey: 'amount' }])
    ).toEqual(['amount'])

    const parsed = parseServerTableUrlState(new URLSearchParams('view='), {
      columnIds: ['amount'],
      defaultVisibility: { amount: true }
    })

    expect(parsed.sorting).toEqual([])
    expect(parsed.columnVisibility).toEqual({ amount: true })
  })
})
