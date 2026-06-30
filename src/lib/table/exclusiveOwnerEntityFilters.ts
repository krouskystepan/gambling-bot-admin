import type { Table as ReactTable } from '@tanstack/react-table'

import type { SearchableTextOption } from '@/components/table/SearchableTextFilter'
import type { SearchableUserOption } from '@/components/table/SearchableUserFilter'

const DISCORD_SNOWFLAKE_PATTERN = /^\d{17,20}$/

export type OwnerEntityRow = {
  entityId: string
  ownerId: string
}

export function isSpecificEntitySelection(
  search: string | undefined,
  options: SearchableTextOption[]
): boolean {
  if (!search) return false
  if (options.some((option) => option.value === search)) return true
  return DISCORD_SNOWFLAKE_PATTERN.test(search)
}

function resolveOwnerIdForSearch(
  search: string,
  options: SearchableTextOption[],
  rows: OwnerEntityRow[]
): string | undefined {
  if (options.some((option) => option.value === search)) {
    return rows.find((row) => row.entityId === search)?.ownerId
  }

  if (DISCORD_SNOWFLAKE_PATTERN.test(search)) {
    return rows.find((row) => row.entityId === search)?.ownerId
  }

  return undefined
}

export function getOwnerFilterMembers(
  members: SearchableUserOption[],
  search: string | undefined,
  entityOptions: SearchableTextOption[],
  rows: OwnerEntityRow[]
): SearchableUserOption[] {
  if (!search || !isSpecificEntitySelection(search, entityOptions)) {
    return members
  }

  const ownerId = resolveOwnerIdForSearch(search, entityOptions, rows)
  if (!ownerId) {
    return members
  }

  const owner = members.find((member) => member.userId === ownerId)
  if (owner) {
    return [owner]
  }

  return [{ userId: ownerId, username: ownerId }]
}

export function getEntityFilterOptions(
  options: SearchableTextOption[],
  ownerId: string | undefined,
  rows: OwnerEntityRow[]
): SearchableTextOption[] {
  if (!ownerId) {
    return options
  }

  const entityIds = new Set(
    rows.filter((row) => row.ownerId === ownerId).map((row) => row.entityId)
  )

  return options.filter((option) => entityIds.has(option.value))
}

type ExclusiveOwnerEntityFilterConfig<TData> = {
  table: ReactTable<TData>
  options: SearchableTextOption[]
  rows: OwnerEntityRow[]
}

export function createExclusiveOwnerEntityFilterHandlers<TData>({
  table,
  options,
  rows
}: ExclusiveOwnerEntityFilterConfig<TData>) {
  const handleOwnerChange = (ownerId: string | undefined) => {
    const searchColumn = table.getColumn('search')
    const currentSearch = searchColumn?.getFilterValue() as string | undefined

    table.getColumn('userId')?.setFilterValue(ownerId)

    if (currentSearch && isSpecificEntitySelection(currentSearch, options)) {
      const entityOwnerId = resolveOwnerIdForSearch(
        currentSearch,
        options,
        rows
      )

      if (ownerId && entityOwnerId && ownerId !== entityOwnerId) {
        searchColumn?.setFilterValue(undefined)
      }
    }
  }

  const handleEntityChange = (search: string | undefined) => {
    table.getColumn('search')?.setFilterValue(search)

    if (search && isSpecificEntitySelection(search, options)) {
      const ownerId = resolveOwnerIdForSearch(search, options, rows)
      table.getColumn('userId')?.setFilterValue(ownerId)
    }
  }

  return { handleOwnerChange, handleEntityChange }
}
