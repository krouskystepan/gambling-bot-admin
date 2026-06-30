import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import CopyableCode from './CopyableCode'
import DevCardRow from './DevCardRow'

const RuntimeInfoCard = () => {
  const nodeEnv = process.env.NODE_ENV ?? 'unknown'
  const deployment = process.env.VERCEL ? 'Vercel' : 'Local'
  const vercelEnv = process.env.VERCEL_ENV ?? '-'
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const serverTime = new Date().toLocaleString('en-GB', { hour12: false })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime</CardTitle>
        <CardDescription>Server environment snapshot.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DevCardRow label="Node env">
          <CopyableCode value={nodeEnv} />
        </DevCardRow>
        <DevCardRow label="Deployment">
          <CopyableCode value={deployment} />
        </DevCardRow>
        <DevCardRow label="Vercel env">
          <CopyableCode value={vercelEnv} />
        </DevCardRow>
        <DevCardRow label="Server timezone">
          <CopyableCode value={timezone} />
        </DevCardRow>
        <DevCardRow label="Server time">
          <CopyableCode value={serverTime} />
        </DevCardRow>
      </CardContent>
    </Card>
  )
}

export default RuntimeInfoCard
