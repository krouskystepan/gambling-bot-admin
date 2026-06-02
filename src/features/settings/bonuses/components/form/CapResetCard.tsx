'use client'

import { Shield } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TBonusFormValues } from '@/types/types'

const CapResetCard = () => {
  const form = useFormContext<TBonusFormValues>()

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-4" />
          Cap & reset
        </CardTitle>
        <CardDescription>
          Limit the maximum streak reward and optionally restart the cycle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <FormField
          control={form.control}
          name="maxReward"
          render={({ field }) => (
            <FormItem>
              <Label>Max reward</Label>
              <FormControl>
                <Input
                  variant="muted"
                  type="text"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    field.onChange(Number(value))
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resetOnMax"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border px-4 py-3">
              <div className="space-y-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="cursor-help underline decoration-dotted underline-offset-4">
                      Reset on max
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    When the base reward exceeds the cap, the streak cycles back
                    to day 1 instead of staying capped. Milestone bonuses still
                    apply on weekly and monthly days.
                  </TooltipContent>
                </Tooltip>
                <p className="text-xs text-muted-foreground">
                  Restart the streak cycle when the cap is reached
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default CapResetCard
