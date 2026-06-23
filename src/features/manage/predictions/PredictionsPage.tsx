import { getPredictionPageContext } from '@/actions/database/predictionActions.action'
import LoadFailed from '@/components/states/LoadFailed'
import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'

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
    userId?: string
    sort?: string
    status?: string
  }
}) => {
  const session = await requireSession()

  const query = normalizePredictionsSearchParams(searchParams)
  const [{ predictions, total, guildMembers }, pageContext] = await Promise.all(
    [
      getPredictionsData(guildId, session, query),
      getPredictionPageContext(guildId)
    ]
  )

  if (!pageContext) return <LoadFailed />

  return (
    <FeatureLayout title="Predictions">
      <PredictionsTable
        guildId={guildId}
        predictions={predictions}
        guildMembers={guildMembers}
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
