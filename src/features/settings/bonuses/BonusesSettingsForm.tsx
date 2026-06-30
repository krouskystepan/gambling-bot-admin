'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  type BonusSettings,
  generateBonusPreview
} from 'gambling-bot-shared/bonus'
import { type GlobalSettings } from 'gambling-bot-shared/guild'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { useMemo, useState } from 'react'

import { saveBonusSettings } from '@/actions/database/bonusSettings.action'
import SettingsFormLayout from '@/components/form/SettingsFormLayout'
import FormActionsFooter from '@/components/page/FormActionsFooter'
import { Form } from '@/components/ui/form'
import { bonusFormSchema } from '@/types/schemas'
import { TBonusFormInput, TBonusFormValues } from '@/types/types'

import { DEFAULT_PREVIEW_DAYS } from './bonusPreviewConstants'
import BonusPreviewPanel from './components/BonusPreviewPanel'
import CapResetCard from './components/form/CapResetCard'
import MilestonesCard from './components/form/MilestonesCard'
import RewardCurveCard from './components/form/RewardCurveCard'

type BonusesSettigsProps = {
  guildId: string
  globalSettings: GlobalSettings
  savedSettings: TBonusFormValues
}

const toBonusSettings = (
  watched: ReturnType<typeof useWatch<TBonusFormInput>>
): BonusSettings => ({
  rewardMode: (watched.rewardMode ?? 'linear') as BonusSettings['rewardMode'],
  baseReward: Number(watched.baseReward ?? 0),
  streakIncrement: Number(watched.streakIncrement ?? 0),
  streakMultiplier: Number(watched.streakMultiplier ?? 1),
  maxReward: Number(watched.maxReward ?? 0),
  resetOnMax: watched.resetOnMax ?? false,
  milestoneBonus: {
    weekly: Number(watched.milestoneBonus?.weekly ?? 0),
    monthly: Number(watched.milestoneBonus?.monthly ?? 0)
  }
})

const BonuseSettingsForm = ({
  guildId,
  globalSettings,
  savedSettings
}: BonusesSettigsProps) => {
  const [previewDays, setPreviewDays] = useState(DEFAULT_PREVIEW_DAYS)

  const form = useForm<TBonusFormInput, unknown, TBonusFormValues>({
    resolver: zodResolver(bonusFormSchema),
    defaultValues: savedSettings,
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  })

  const onSubmit = async (values: TBonusFormValues) => {
    const toastId = toast.loading('Saving bonus settings...')
    try {
      await saveBonusSettings(guildId, values)
      form.reset(values)
      toast.success('Bonus settings saved!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to save bonus settings', { id: toastId })
    }
  }

  const watched = useWatch({ control: form.control })

  const settings = useMemo(() => toBonusSettings(watched ?? {}), [watched])

  const preview = useMemo(
    () => generateBonusPreview(settings, previewDays),
    [settings, previewDays]
  )

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsFormLayout
            actions={<FormActionsFooter label="Save bonus settings" />}
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr] lg:items-start">
              <div className="order-2 flex flex-col gap-6 lg:order-1">
                <RewardCurveCard globalSettings={globalSettings} />
                <CapResetCard />
                <MilestonesCard />
              </div>

              <BonusPreviewPanel
                className="order-1 lg:order-2"
                globalSettings={globalSettings}
                preview={preview}
                previewDays={previewDays}
                onPreviewDaysChange={setPreviewDays}
              />
            </div>
          </SettingsFormLayout>
        </form>
      </Form>
    </FormProvider>
  )
}

export default BonuseSettingsForm
