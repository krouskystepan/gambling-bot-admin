import { getQuestPageContext } from '@/actions/database/questActions.action'
import LoadFailed from '@/components/states/LoadFailed'
import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'

import QuestsTable from './table/QuestsTable'
import { getQuestsData, normalizeQuestsSearchParams } from './useQuests'

const QuestsPage = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    page?: string
    limit?: string
    search?: string
    sort?: string
    kind?: string
  }
}) => {
  const session = await requireSession()
  const query = normalizeQuestsSearchParams(searchParams)

  const [{ quests, total }, pageContext, globalSettings] = await Promise.all([
    getQuestsData(guildId, session, query),
    getQuestPageContext(guildId),
    getGuildGlobalSettings(guildId)
  ])

  if (!pageContext) return <LoadFailed />

  return (
    <FeatureLayout
      title="Quests"
      description="Configure daily and normal quests and their bonus rewards"
    >
      <QuestsTable
        guildId={guildId}
        quests={quests}
        globalSettings={globalSettings}
        page={query.page}
        limit={query.limit}
        total={total}
        kind={query.kind}
        questFeatureBlocked={pageContext.questFeatureBlocked}
        questFeatureBlockMessage={pageContext.questFeatureBlockMessage}
      />
    </FeatureLayout>
  )
}

export default QuestsPage
