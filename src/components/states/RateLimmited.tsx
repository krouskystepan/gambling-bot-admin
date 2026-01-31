'use client'

import { Clock } from 'lucide-react'

import { Button } from '../ui/button'
import StateLayout from './StateLayout'

const RateLimited = () => {
  return (
    <StateLayout
      Icon={
        <Clock className="h-12 w-12 animate-pulse text-blue-500 drop-shadow-lg" />
      }
      titleText="Rate Limited"
      titleStyle="bg-linear-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent animate-gradient-x"
      description="Discord is temporarily limiting requests. Please wait a bit and try again."
      button={
        <Button
          className="mt-2 cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      }
    />
  )
}

export default RateLimited
