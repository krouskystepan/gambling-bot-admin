import type { Session } from 'next-auth'

import {
  type SettingsChangeCounts,
  type SettingsChangeEntityFacets,
  type SettingsChangeRow,
  getSettingsChangeCounts,
  getSettingsChangeEntityFacets,
  getSettingsChanges
} from '@/actions/database/settingsChanges.action'
import { getGuildStaffMembers } from '@/actions/database/staffActions.action'
import {
  SETTINGS_CHANGE_SECTIONS,
  type SettingsChangeSection,
  isSettingsChangeSection
} from '@/lib/settingsAudit/settingsChangeSections'

export interface SettingsChangesQuery {
  page: number
  limit: number
  staffId?: string
  filterSection?: SettingsChangeSection[]
  dateFrom?: string
  dateTo?: string
}

export interface SettingsChangesResult {
  changes: SettingsChangeRow[]
  counts: SettingsChangeCounts
  entityFacets: SettingsChangeEntityFacets
  total: number
  staffMembers: { userId: string; username: string }[]
}

export async function getSettingsChangesData(
  guildId: string,
  session: Session,
  query: SettingsChangesQuery
): Promise<SettingsChangesResult> {
  const filters = {
    staffId: query.staffId,
    filterSection: query.filterSection,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo
  }

  const [{ changes, total }, counts, entityFacets, staffMembers] =
    await Promise.all([
      getSettingsChanges(guildId, session, query.page, query.limit, filters),
      getSettingsChangeCounts(guildId, session, filters),
      getSettingsChangeEntityFacets(guildId, session, filters),
      getGuildStaffMembers(guildId)
    ])

  return { changes, counts, entityFacets, total, staffMembers }
}

type RawSearchParams = {
  page?: string
  limit?: string
  staffId?: string
  filterSection?: string
  dateFrom?: string
  dateTo?: string
}

export function normalizeSettingsChangesSearchParams(
  searchParams: RawSearchParams = {}
): SettingsChangesQuery {
  const page = Number(searchParams.page)
  const limit = Number(searchParams.limit)
  const filterSection = searchParams.filterSection
    ?.split(',')
    .filter(isSettingsChangeSection)

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    staffId: searchParams.staffId,
    filterSection: filterSection?.length ? filterSection : undefined,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo
  }
}

export { SETTINGS_CHANGE_SECTIONS }
