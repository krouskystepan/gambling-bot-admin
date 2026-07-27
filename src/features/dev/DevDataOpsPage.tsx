import { AlertTriangle } from 'lucide-react'

import FeatureLayout from '@/features/FeatureLayout'
import { getDevGuildCounts } from '@/lib/dev/devGuildDiagnostics'

import DevConfigResetCard from './components/DevConfigResetCard'
import DevDataWipeCard from './components/DevDataWipeCard'
import { requireDevPage } from './requireDevPage'

const DevDataOpsPage = async ({ guildId }: { guildId: string }) => {
  await requireDevPage(guildId)

  const counts = await getDevGuildCounts(guildId)

  return (
    <FeatureLayout
      title="Danger zone"
      description="Destructive data ops — use with extreme care"
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="size-4" />
            Irreversible dev tooling
          </div>
          <p>
            Actions on this page permanently change guild data or configuration.
            Dev-only access. These operations are not recorded in the staff
            audit log. Inspect current counts on the Guild page before wiping.
          </p>
        </div>

        <DevDataWipeCard guildId={guildId} counts={counts} />
        <DevConfigResetCard guildId={guildId} />
      </div>
    </FeatureLayout>
  )
}

export default DevDataOpsPage
