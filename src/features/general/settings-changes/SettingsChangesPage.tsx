import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'

import SettingsChangesTable from './table/SettingsChangesTable'
import {
  getSettingsChangesData,
  normalizeSettingsChangesSearchParams
} from './useSettingsChanges'

const SettingsChangesPage = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    page?: string
    limit?: string
    staffId?: string
    filterSection?: string
    dateFrom?: string
    dateTo?: string
  }
}) => {
  const session = await requireSession()

  const query = normalizeSettingsChangesSearchParams(searchParams)

  const { changes, counts, entityFacets, total, staffMembers } =
    await getSettingsChangesData(guildId, session, query)

  return (
    <FeatureLayout title="Settings changes">
      <SettingsChangesTable
        changes={changes}
        counts={counts}
        entityFacets={entityFacets}
        staffMembers={staffMembers}
        page={query.page}
        limit={query.limit}
        total={total}
      />
    </FeatureLayout>
  )
}

export default SettingsChangesPage
