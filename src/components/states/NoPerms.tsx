import { AlertCircle } from 'lucide-react'

import Link from 'next/link'

import { Button } from '../ui/button'
import StateLayout from './StateLayout'

const NoPerms = () => {
  return (
    <StateLayout
      Icon={
        <AlertCircle className="h-12 w-12 animate-pulse text-destructive drop-shadow-lg" />
      }
      titleText="No Permissions"
      titleTone="destructive"
      description="You do not have the required permissions to view this page. Contact your server admin if you believe this is a mistake."
      button={
        <Button
          variant="destructive"
          className="px-6 py-3 font-semibold"
          asChild
        >
          <Link href={'/dashboard'}>Back to Dashboard</Link>
        </Button>
      }
    />
  )
}

export default NoPerms
