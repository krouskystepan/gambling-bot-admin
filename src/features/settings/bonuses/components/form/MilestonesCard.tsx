'use client'

import { BONUS_MAX_AMOUNT, parseBonusAmountInput } from 'gambling-bot-shared'
import { Gift } from 'lucide-react'
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
import { TBonusFormInput } from '@/types/types'

const MilestonesCard = () => {
  const form = useFormContext<TBonusFormInput>()

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <Gift className="size-4" />
          Milestones
        </CardTitle>
        <CardDescription>
          Added on top of streak reward on days 7, 14, 21… and day 28
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="milestoneBonus.weekly"
          render={({ field }) => (
            <FormItem>
              <Label>Weekly bonus (every 7 days)</Label>
              <FormControl>
                <Input
                  variant="muted"
                  type="text"
                  inputMode="numeric"
                  maxLength={String(BONUS_MAX_AMOUNT).length}
                  onChange={(e) => field.onChange(parseBonusAmountInput(e.target.value))}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="milestoneBonus.monthly"
          render={({ field }) => (
            <FormItem>
              <Label>Monthly bonus (day 28)</Label>
              <FormControl>
                <Input
                  variant="muted"
                  type="text"
                  inputMode="numeric"
                  maxLength={String(BONUS_MAX_AMOUNT).length}
                  onChange={(e) => field.onChange(parseBonusAmountInput(e.target.value))}
                  value={field.value}
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

export default MilestonesCard
