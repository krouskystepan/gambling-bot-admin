import { getServerSession } from 'next-auth'

import { getPredictionPageContext } from '@/actions/database/predictionActions.action'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/auth/authOptions'

import PredictionsTable from './table/PredictionsTable'
import {
  getPredictionsData,
  normalizePredictionsSearchParams
} from './usePredictions'

const PredictionsPage = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    page?: string
    limit?: string
    search?: string
    sort?: string
    status?: string
  }
}) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const query = normalizePredictionsSearchParams(searchParams)
  const [{ predictions, total }, pageContext] = await Promise.all([
    getPredictionsData(guildId, session, query),
    getPredictionPageContext(guildId)
  ])

  if (!pageContext) return null

  return (
    <FeatureLayout title="Predictions">
      <PredictionsTable
        guildId={guildId}
        predictions={predictions}
        page={query.page}
        limit={query.limit}
        total={total}
        status={query.status}
        predictionConfigured={pageContext.predictionConfigured}
        logsChannelConfigured={pageContext.logsChannelConfigured}
        predictionFeatureBlocked={pageContext.predictionFeatureBlocked}
        predictionFeatureBlockMessage={
          pageContext.predictionFeatureBlockMessage
        }
      />
    </FeatureLayout>
  )
}

export default PredictionsPage
