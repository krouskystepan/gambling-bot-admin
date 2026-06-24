import { DEV_GUILDS, DEV_USERS } from 'gambling-bot-shared/dev'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import CopyableCode from './CopyableCode'
import DevCardRow from './DevCardRow'

type DevInfoCardProps = {
  guildId: string
  userId: string
  isAdmin: boolean
  isManager: boolean
  isDev: boolean
}

const DevInfoCard = ({
  guildId,
  userId,
  isAdmin,
  isManager,
  isDev
}: DevInfoCardProps) => {
  const flags = `isAdmin=${isAdmin} · isManager=${isManager} · isDev=${isDev}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session & access</CardTitle>
        <CardDescription>
          Runtime context for debugging permissions and dev gating.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DevCardRow label="Guild ID">
          <CopyableCode value={guildId} />
        </DevCardRow>
        <DevCardRow label="User ID">
          <CopyableCode value={userId} />
        </DevCardRow>
        <DevCardRow label="Flags">
          <CopyableCode value={flags} />
        </DevCardRow>
        <DevCardRow label="Dev guilds">
          <CopyableCode value={DEV_GUILDS.join(', ') || '—'} />
        </DevCardRow>
        <DevCardRow label="Dev users">
          <CopyableCode value={DEV_USERS.join(', ') || '—'} />
        </DevCardRow>
      </CardContent>
    </Card>
  )
}

export default DevInfoCard
