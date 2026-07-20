import { getRafflePageContext } from '@/actions/database/raffleActions.action'
import LoadFailed from '@/components/states/LoadFailed'
import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'

import RaffleTable from './table/RaffleTable'
import { getRafflesData, normalizeRafflesSearchParams } from './useRaffles'

const RafflesPage = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    page?: string
    limit?: string
    search?: string
    userId?: string
    sort?: string
    status?: string
  }
}) => {
  const session = await requireSession()

  const query = normalizeRafflesSearchParams(searchParams)
  const [{ raffles, total, guildMembers }, pageContext] = await Promise.all([
    getRafflesData(guildId, session, query),
    getRafflePageContext(guildId)
  ])

  if (!pageContext) return <LoadFailed />

  return (
    <FeatureLayout title="Raffles" description="Create and manage raffles">
      <RaffleTable
        guildId={guildId}
        raffles={raffles}
        guildMembers={guildMembers}
        page={query.page}
        limit={query.limit}
        total={total}
        status={query.status}
        raffleConfigured={pageContext.raffleConfigured}
        raffleFeatureBlocked={pageContext.raffleFeatureBlocked}
        raffleFeatureBlockMessage={pageContext.raffleFeatureBlockMessage}
      />
    </FeatureLayout>
  )
}

export default RafflesPage
