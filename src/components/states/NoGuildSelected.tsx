import { Sparkles } from 'lucide-react'

import StateLayout from './StateLayout'

const NoGuildSelected = () => {
  return (
    <StateLayout
      Icon={
        <Sparkles className="h-12 w-12 animate-pulse text-primary drop-shadow-lg" />
      }
      titleText="No Guild Selected"
      description="Select a guild from the sidebar to start managing it. You can see stats,
        settings, and interact with your bot here."
    />
  )
}

export default NoGuildSelected
