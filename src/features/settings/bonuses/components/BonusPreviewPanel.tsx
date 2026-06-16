'use client'

import { type PreviewDay } from 'gambling-bot-shared/bonus'
import { type GlobalSettings } from 'gambling-bot-shared/guild'

import dynamic from 'next/dynamic'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { PREVIEW_DAY_OPTIONS } from '../bonusPreviewConstants'
import BonusesCalendar from '../preview/BonusesCalendar'

const BonusRewardChart = dynamic(() => import('./BonusRewardChart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] w-full items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
      Loading chart…
    </div>
  )
})

type BonusPreviewPanelProps = {
  globalSettings: GlobalSettings
  preview: PreviewDay[]
  previewDays: number
  onPreviewDaysChange: (days: number) => void
  className?: string
}

const BonusPreviewPanel = ({
  globalSettings,
  preview,
  previewDays,
  onPreviewDaysChange,
  className
}: BonusPreviewPanelProps) => {
  return (
    <Card className={cn('min-w-0 gap-4 py-4 lg:sticky lg:top-4', className)}>
      <CardHeader className="gap-3 pb-0">
        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Reward curve over {previewDays} days
            </CardDescription>
          </div>
          <div className="flex w-full rounded-lg border bg-muted/40 p-1">
            {PREVIEW_DAY_OPTIONS.map((days) => (
              <Button
                key={days}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 flex-1 px-1 text-xs sm:text-sm',
                  previewDays === days && 'bg-background shadow-sm'
                )}
                onClick={() => onPreviewDaysChange(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <p className="text-sm font-medium">Reward curve</p>
          <BonusRewardChart preview={preview} globalSettings={globalSettings} />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">All days</p>
          <BonusesCalendar
            preview={preview}
            globalSettings={globalSettings}
            compact
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default BonusPreviewPanel
