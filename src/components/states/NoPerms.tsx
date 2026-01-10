import { AlertCircle } from 'lucide-react'

import Link from 'next/link'

import { Button } from '../ui/button'
import StateLayout from './StateLayout'

const NoPerms = () => {
  return (
    <StateLayout
      Icon={
        <AlertCircle className="h-12 w-12 animate-pulse text-red-500 drop-shadow-lg" />
      }
      titleText="No Permissions"
      titleStyle="bg-linear-to-r from-red-600 to-red-500 bg-clip-text text-transparent animate-gradient-x"
      description="You do not have the required permissions to view this page. Contact your server admin if you believe this is a mistake."
      button={
        <Button
          className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-red-700"
          asChild
        >
          <Link href={'/dashboard'}>Back to Dashboard</Link>
        </Button>
      }
    />
  )
}

export default NoPerms
