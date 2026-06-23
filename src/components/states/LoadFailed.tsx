'use client'

import { AlertCircle } from 'lucide-react'

import { Button } from '../ui/button'
import StateLayout from './StateLayout'

const LoadFailed = () => {
  return (
    <StateLayout
      Icon={
        <AlertCircle className="h-12 w-12 animate-pulse text-destructive drop-shadow-lg" />
      }
      titleText="Failed to load"
      titleTone="destructive"
      description="Something went wrong while loading this page. Please try again."
      button={
        <Button
          className="mt-2 cursor-pointer px-6 py-3 font-semibold"
          onClick={() => window.location.reload()}
          variant="destructive"
        >
          Refresh Page
        </Button>
      }
    />
  )
}

export default LoadFailed
