import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'

import BansTable from './table/BansTable'
import { getBansData, normalizeBansSearchParams } from './useBans'

const BansPage = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    page?: string
    limit?: string
    userId?: string
    sort?: string
    status?: string
  }
}) => {
  const session = await requireSession()

  const query = normalizeBansSearchParams(searchParams)
  const { bans, total, guildMembers } = await getBansData(
    guildId,
    session,
    query
  )

  return (
    <FeatureLayout
      title="Bans"
      description="Guild-wide ban history and active bans"
    >
      <BansTable
        guildId={guildId}
        bans={bans}
        guildMembers={guildMembers}
        page={query.page}
        limit={query.limit}
        total={total}
        status={query.status}
      />
    </FeatureLayout>
  )
}

export default BansPage
