import { getHealthPageData } from '@/actions/database/health.action'
import LoadFailed from '@/components/states/LoadFailed'
import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'

import OperationsHealthCard from './components/OperationsHealthCard'
import SetupHealthCard from './components/SetupHealthCard'

const HealthPage = async ({ guildId }: { guildId: string }) => {
  const session = await requireSession()

  const data = await getHealthPageData(guildId, session)
  if (!data) return <LoadFailed />

  const { operations, setup } = data

  return (
    <FeatureLayout
      title="Health"
      description="Bot and guild health signals worth checking first"
    >
      <div className="space-y-6">
        <OperationsHealthCard guildId={guildId} operations={operations} />
        {setup ? <SetupHealthCard checks={setup} /> : null}
      </div>
    </FeatureLayout>
  )
}

export default HealthPage
