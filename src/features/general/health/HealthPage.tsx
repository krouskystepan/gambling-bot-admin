import { getServerSession } from 'next-auth'

import { getHealthPageData } from '@/actions/database/health.action'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/auth/authOptions'

import OperationsHealthCard from './components/OperationsHealthCard'
import SetupHealthCard from './components/SetupHealthCard'

const HealthPage = async ({ guildId }: { guildId: string }) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const data = await getHealthPageData(guildId, session)
  if (!data) return null

  const { operations, setup } = data

  return (
    <FeatureLayout title="Health">
      <div className="space-y-6">
        <OperationsHealthCard operations={operations} />
        {setup ? <SetupHealthCard checks={setup} /> : null}
      </div>
    </FeatureLayout>
  )
}

export default HealthPage
