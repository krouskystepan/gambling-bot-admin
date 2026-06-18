import { getServerSession } from 'next-auth'

import { getRafflePageContext } from '@/actions/database/raffleActions.action'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/auth/authOptions'

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
  const session = await getServerSession(authOptions)
  if (!session) return null

  const query = normalizeRafflesSearchParams(searchParams)
  const [{ raffles, total, guildMembers }, pageContext] = await Promise.all([
    getRafflesData(guildId, session, query),
    getRafflePageContext(guildId)
  ])

  if (!pageContext) return null

  return (
    <FeatureLayout title="Raffles">
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
