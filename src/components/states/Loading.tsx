import { Loader2 } from 'lucide-react'

import StateLayout from './StateLayout'

const LoadingScreen = () => {
  return (
    <StateLayout
      Icon={
        <Loader2 className="h-12 w-12 animate-spin text-primary drop-shadow-lg" />
      }
      titleText="Loading..."
      description="Please wait while we prepare everything for you."
    />
  )
}

export default LoadingScreen
