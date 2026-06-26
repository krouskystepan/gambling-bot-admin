'use client'

import { RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

type AtmQueueLiveUpdateBannerProps = {
  show: boolean
  onRefresh: () => void
}

const AtmQueueLiveUpdateBanner = ({
  show,
  onRefresh
}: AtmQueueLiveUpdateBannerProps) => {
  if (!show) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm">
      <p className="text-muted-foreground">
        Queue updated — Refresh to see latest
      </p>
      <Button size="sm" className="h-8 gap-1.5" onClick={onRefresh}>
        <RefreshCcw className="size-3.5" />
        Refresh
      </Button>
    </div>
  )
}

export default AtmQueueLiveUpdateBanner
