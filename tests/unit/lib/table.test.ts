import { describe, expect, it, vi } from 'vitest'

import {
  createExclusiveOwnerEntityFilterHandlers,
  getEntityFilterOptions,
  getOwnerFilterMembers,
  isSpecificEntitySelection
} from '@/lib/table/exclusiveOwnerEntityFilters'
import {
  canSelectFacetValue,
  filterMembersByEntityFacet,
  getVisibleFacetOptions,
  isEntityCompatibleWithFacet,
  pruneFacetValues
} from '@/lib/table/facetFilters'
import { formatOptionalText } from '@/lib/table/formatOptionalText'
import {
  createHiddenFilterColumn,
  createManualTableFilterFn
} from '@/lib/table/manualFilterColumn'
import {
  getLeafColumnIds,
  parseServerTableUrlState
} from '@/lib/table/parseServerTableUrlState'
import {
  filterMembersByRegistration,
  getVisibleRegistrationOptions,
  isMemberCompatibleWithRegistration,
  registrationFilterOptions
} from '@/lib/table/registrationMemberFilters'

describe('table helpers', () => {
  it('formatOptionalText trims and falls back', () => {
    expect(formatOptionalText('  hello  ')).toBe('hello')
    expect(formatOptionalText('   ', 'n/a')).toBe('n/a')
  })

  it('facet filters prune and restrict members', () => {
    const options = [
      { value: 'a', label: 'A', realValue: 'a' as const },
      { value: 'b', label: 'B', realValue: 'b' as const }
    ]

    expect(
      getVisibleFacetOptions(options, [options[0]], { a: 1, b: 0 })
    ).toHaveLength(1)
    expect(pruneFacetValues(['a', 'b'], { a: 1, b: 0 })).toEqual(['a'])
    expect(pruneFacetValues(['b'], { b: 0 })).toBeUndefined()
    expect(pruneFacetValues(undefined, { b: 1 })).toBeUndefined()
    expect(canSelectFacetValue('b', { b: 0 })).toBe(false)
    expect(
      getVisibleFacetOptions(options, [options[1]], { a: 0, b: 0 })
    ).toHaveLength(1)
    expect(
      filterMembersByEntityFacet(
        [{ userId: 'u1' }, { userId: 'u2' }],
        'u1',
        { u1: 1, u2: 0 },
        true
      )
    ).toEqual([{ userId: 'u1' }])
    expect(
      filterMembersByEntityFacet(
        [{ userId: 'u1' }, { userId: 'u2' }],
        undefined,
        {},
        false
      )
    ).toHaveLength(2)
    expect(isEntityCompatibleWithFacet('u2', { u2: 0 }, true)).toBe(false)
    expect(isEntityCompatibleWithFacet('u2', { u2: 0 }, false)).toBe(true)
  })

  it('manual filter column helpers always pass and render hidden cells', () => {
    const filterFn = createManualTableFilterFn<{ id: string }>()
    expect(filterFn({} as never, 'col', '', {} as never)).toBe(true)
    expect(filterFn.autoRemove?.('' as never, {} as never)).toBe(false)

    const column = createHiddenFilterColumn<{ id: string }>('search')
    expect(column.id).toBe('search')
    expect(column.enableSorting).toBe(false)
    expect((column.header as (ctx: never) => null)({} as never)).toBeNull()
    expect((column.cell as (ctx: never) => null)({} as never)).toBeNull()
  })

  it('registration filters respect registered set', () => {
    const members = [
      { userId: 'u1', username: 'One' },
      { userId: 'u2', username: 'Two' }
    ]
    const registered = new Set(['u1'])

    expect(
      filterMembersByRegistration(members, 'all', registered)
    ).toHaveLength(2)
    expect(
      filterMembersByRegistration(members, 'registered', registered)
    ).toEqual([members[0]])
    expect(
      filterMembersByRegistration(members, 'not_registered', registered)
    ).toEqual([members[1]])
    expect(isMemberCompatibleWithRegistration('u1', 'all', registered)).toBe(
      true
    )
    expect(
      isMemberCompatibleWithRegistration('u1', 'not_registered', registered)
    ).toBe(false)
    expect(
      isMemberCompatibleWithRegistration('u1', 'registered', registered)
    ).toBe(true)
    expect(getVisibleRegistrationOptions(undefined, registered)).toEqual(
      registrationFilterOptions
    )
    expect(getVisibleRegistrationOptions('u1', registered)).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ value: 'not_registered' })
      ])
    )
    expect(getVisibleRegistrationOptions('u2', registered)).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ value: 'registered' })
      ])
    )
  })

  it('parseServerTableUrlState hydrates sorting, filters, and visibility', () => {
    const columns = [
      {
        id: 'group',
        columns: [{ accessorKey: 'amount' }, { id: 'user' }]
      }
    ]

    expect(getLeafColumnIds(columns)).toEqual(['amount', 'user'])

    const parsed = parseServerTableUrlState(
      new URLSearchParams('sort=amount:desc&view=!amount,user'),
      {
        columnIds: ['amount', 'user', 'notes'],
        defaultVisibility: { notes: false },
        filters: (params) => [
          { id: 'search', value: params.get('search') ?? undefined },
          { id: 'empty', value: undefined }
        ]
      }
    )

    expect(parsed.sorting).toEqual([{ id: 'amount', desc: true }])
    expect(parsed.columnFilters).toEqual([])
    expect(parsed.columnVisibility).toEqual({
      amount: true,
      user: false,
      notes: false
    })

    const defaultView = parseServerTableUrlState(new URLSearchParams(), {
      columnIds: ['amount'],
      defaultVisibility: { amount: false }
    })
    expect(defaultView.columnVisibility).toEqual({ amount: false })
  })

  it('exclusive owner/entity filters coordinate table columns', () => {
    const rows = [{ entityId: 'ent-1', ownerId: 'owner-1' }]
    const options = [{ value: 'ent-1', label: 'Entity 1' }]
    const members = [
      { userId: 'owner-1', username: 'Owner' },
      { userId: 'owner-2', username: 'Other' }
    ]

    expect(isSpecificEntitySelection('ent-1', options)).toBe(true)
    expect(isSpecificEntitySelection('123456789012345678', options)).toBe(true)
    expect(isSpecificEntitySelection(undefined, [])).toBe(false)
    expect(getOwnerFilterMembers(members, 'ent-1', options, rows)).toEqual([
      members[0]
    ])
    expect(
      getOwnerFilterMembers(
        members,
        'ent-1',
        [{ value: 'ent-1', label: 'Entity 1' }],
        [{ entityId: 'ent-1', ownerId: 'owner-1' }]
      )
    ).toEqual([members[0]])
    expect(
      getOwnerFilterMembers(members, '999999999999999999', [], [])
    ).toEqual(members)
    expect(
      getOwnerFilterMembers(
        [{ userId: 'owner-2', username: 'Other' }],
        '123456789012345678',
        [],
        [{ entityId: '123456789012345678', ownerId: 'owner-9' }]
      )
    ).toEqual([{ userId: 'owner-9', username: 'owner-9' }])
    expect(getEntityFilterOptions(options, undefined, rows)).toEqual(options)
    expect(getEntityFilterOptions(options, 'owner-1', rows)).toEqual(options)
    expect(getOwnerFilterMembers(members, undefined, options, rows)).toEqual(
      members
    )
    expect(getEntityFilterOptions(options, 'owner-2', rows)).toEqual([])

    const setFilterValue = vi.fn()
    const getFilterValue = vi.fn().mockReturnValue('ent-1')
    const table = {
      getColumn: vi.fn((id: string) =>
        id === 'search'
          ? { getFilterValue, setFilterValue }
          : { setFilterValue }
      )
    }

    const { handleOwnerChange, handleEntityChange } =
      createExclusiveOwnerEntityFilterHandlers({
        table: table as never,
        options,
        rows
      })

    const matchingHandlers = createExclusiveOwnerEntityFilterHandlers({
      table: table as never,
      options,
      rows
    })
    matchingHandlers.handleOwnerChange('owner-1')

    handleOwnerChange('owner-2')
    expect(setFilterValue).toHaveBeenCalledWith(undefined)

    handleEntityChange('ent-1')
    expect(setFilterValue).toHaveBeenCalledWith('ent-1')
    expect(setFilterValue).toHaveBeenCalledWith('owner-1')

    const snowflakeRows = [
      { entityId: '123456789012345678', ownerId: 'owner-9' }
    ]
    createExclusiveOwnerEntityFilterHandlers({
      table: table as never,
      options: [],
      rows: snowflakeRows
    }).handleEntityChange('123456789012345678')

    const noopTable = {
      getColumn: vi.fn((id: string) =>
        id === 'search'
          ? {
              getFilterValue: vi.fn().mockReturnValue(undefined),
              setFilterValue
            }
          : { setFilterValue }
      )
    }
    const noopHandlers = createExclusiveOwnerEntityFilterHandlers({
      table: noopTable as never,
      options,
      rows
    })
    noopHandlers.handleOwnerChange('owner-2')
    noopHandlers.handleEntityChange(undefined)
  })
})
