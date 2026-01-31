'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { useMemo } from 'react'

import { saveBonusSettings } from '@/actions/database/bonusSettings.action'
import SaveButton from '@/components/SaveButton'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { bonusFormSchema } from '@/types/schemas'
import { TBonusFormValues } from '@/types/types'

import BonusesCalendar from './preview/BonusesCalendar'
import { PREVIEW_DAYS, generateBonusPreview } from './preview/bonusPreview'

type BonusesSettigsProps = {
  guildId: string
  savedSettings: TBonusFormValues
}

const BonuseSettingsForm = ({
  guildId,
  savedSettings
}: BonusesSettigsProps) => {
  const form = useForm<TBonusFormValues>({
    resolver: zodResolver(bonusFormSchema),
    defaultValues: savedSettings
  })

  const onSubmit = async (values: TBonusFormValues) => {
    const toastId = toast.loading('Saving bonus settings...')
    try {
      await saveBonusSettings(guildId, values)
      toast.success('Bonus settings saved!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to save bonus settings', { id: toastId })
    }
  }

  const watched = useWatch({ control: form.control })
  const {
    baseReward = 0,
    streakIncrement = 0,
    streakMultiplier = 1,
    maxReward = 0,
    resetOnMax = false,
    milestoneBonus: {
      weekly: milestoneWeekly = 0,
      monthly: milestoneMonthly = 0
    } = {},
    rewardMode = 'linear'
  } = watched ?? {}

  const base = Number(baseReward)
  const inc = Number(streakIncrement)
  const mult = Number(streakMultiplier)
  const max = Number(maxReward)
  const weeklyMilestone = Number(milestoneWeekly)
  const monthlyMilestone = Number(milestoneMonthly)

  const preview = useMemo(
    () =>
      generateBonusPreview({
        base,
        increment: inc,
        multiplier: mult,
        max,
        weeklyMilestone,
        monthlyMilestone,
        rewardMode,
        resetOnMax,
        days: PREVIEW_DAYS
      }),
    [
      base,
      inc,
      mult,
      max,
      weeklyMilestone,
      monthlyMilestone,
      rewardMode,
      resetOnMax
    ]
  )

  return (
    <div className="w-full max-w-7xl grid grid-cols-2 gap-4">
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full max-w-2xl flex-col gap-4"
          >
            <h4 className="text-xl font-semibold text-yellow-400">
              Bonus Settings
            </h4>

            <div className="grid w-full grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rewardMode"
                render={({ field }) => (
                  <FormItem>
                    <Label>Reward Mode</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-muted border-transparent shadow-none">
                          <SelectValue placeholder="Select reward mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="exponential">Exponential</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseReward"
                render={({ field }) => (
                  <FormItem>
                    <Label>Base Reward</Label>
                    <FormControl>
                      <Input
                        className="bg-muted border-transparent shadow-none"
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
                name="maxReward"
                render={({ field }) => (
                  <FormItem>
                    <Label>Max Reward</Label>
                    <FormControl>
                      <Input
                        className="bg-muted border-transparent shadow-none"
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

              {rewardMode === 'linear' && (
                <FormField
                  control={form.control}
                  name="streakIncrement"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Streak Increment (Linear)</Label>
                      <FormControl>
                        <Input
                          className="bg-muted border-transparent shadow-none"
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
              )}

              {rewardMode === 'exponential' && (
                <FormField
                  control={form.control}
                  name="streakMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Streak Multiplier (Exponential)</Label>
                      <FormControl>
                        <Input
                          className="bg-muted border-transparent shadow-none"
                          type="text"
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '')
                            field.onChange(Number(value))
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="milestoneBonus.weekly"
                render={({ field }) => (
                  <FormItem>
                    <Label>Weekly Bonus (7d)</Label>
                    <FormControl>
                      <Input
                        className="bg-muted border-transparent shadow-none"
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
                name="milestoneBonus.monthly"
                render={({ field }) => (
                  <FormItem>
                    <Label>Monthly Bonus (28d)</Label>
                    <FormControl>
                      <Input
                        className="bg-muted border-transparent shadow-none"
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
                  <FormItem className="col-start-2 flex flex-row items-center justify-between rounded-lg border px-4 py-2">
                    <Label>Reset On Max Reward</Label>
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
            </div>

            <SaveButton />
          </form>
        </Form>
      </FormProvider>
      <BonusesCalendar preview={preview} />
    </div>
  )
}

export default BonuseSettingsForm
