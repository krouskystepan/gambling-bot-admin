import { LayoutDashboard } from 'lucide-react'

import StateLayout from './StateLayout'

const OpeningGuild = () => {
  return (
    <StateLayout
      Icon={
        <LayoutDashboard className="h-12 w-12 animate-pulse text-primary drop-shadow-lg" />
      }
      titleText="Opening guild..."
      description="Taking you to your preferred landing section."
    />
  )
}

export default OpeningGuild
