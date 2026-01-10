import { Loader2 } from 'lucide-react'

import StateLayout from './StateLayout'

const LoadingScreen = () => {
  return (
    <StateLayout
      Icon={
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400 drop-shadow-lg" />
      }
      titleText="Loading..."
      titleStyle="bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-clip-text text-transparent animate-gradient-x"
      description="Please wait while we prepare everything for you."
    />
  )
}

export default LoadingScreen
