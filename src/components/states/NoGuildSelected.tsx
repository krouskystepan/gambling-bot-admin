import { Sparkles } from 'lucide-react'

import StateLayout from './StateLayout'

const NoGuildSelected = () => {
  return (
    <StateLayout
      Icon={
        <Sparkles className="h-12 w-12 animate-pulse text-yellow-400 drop-shadow-lg" />
      }
      titleText="No Guild Selected"
      titleStyle="bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-clip-text text-transparent animate-gradient-x"
      description="Select a guild from the sidebar to start managing it. You can see stats,
        settings, and interact with your bot here."
    />
  )
}

export default NoGuildSelected
