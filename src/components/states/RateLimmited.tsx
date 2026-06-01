'use client'

import { Clock } from 'lucide-react'

import { Button } from '../ui/button'
import StateLayout from './StateLayout'

const RateLimited = () => {
  return (
    <StateLayout
      Icon={
        <Clock className="h-12 w-12 animate-pulse text-chart-1 drop-shadow-lg" />
      }
      titleText="Rate Limited"
      titleTone="info"
      description="Discord is temporarily limiting requests. Please wait a bit and try again."
      button={
        <Button
          className="mt-2 cursor-pointer bg-chart-1 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-chart-1/90"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      }
    />
  )
}

export default RateLimited
