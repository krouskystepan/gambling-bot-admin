import { getServerSession } from 'next-auth'

import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/auth/authOptions'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'

import StaffActionsTable from './table/StaffActionsTable'
import {
  getStaffActionsData,
  normalizeStaffActionsSearchParams
} from './useStaffActions'

const StaffActionsPage = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    page?: string
    limit?: string
    search?: string
    staffId?: string
    filterAction?: string
    dateFrom?: string
    dateTo?: string
  }
}) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const query = normalizeStaffActionsSearchParams(searchParams)

  const [
    { actions, counts, total, staffMembers, guildMembers },
    globalSettings
  ] = await Promise.all([
    getStaffActionsData(guildId, session, query),
    getGuildGlobalSettings(guildId)
  ])

  return (
    <FeatureLayout title="Staff actions">
      <StaffActionsTable
        guildId={guildId}
        globalSettings={globalSettings}
        actions={actions}
        counts={counts}
        staffMembers={staffMembers}
        guildMembers={guildMembers}
        page={query.page}
        limit={query.limit}
        total={total}
      />
    </FeatureLayout>
  )
}

export default StaffActionsPage
