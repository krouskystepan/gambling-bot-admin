'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { saveGlobalSettings } from '@/actions/database/globalSettings.action'
import SettingsFormLayout from '@/components/form/SettingsFormLayout'
import FormActionsFooter from '@/components/page/FormActionsFooter'
import { Form } from '@/components/ui/form'
import { globalSettingsFormSchema } from '@/types/schemas'
import {
  TGlobalSettingsFormInput,
  TGlobalSettingsFormValues
} from '@/types/types'

import FeatureSwitchesCard from './components/FeatureSwitchesCard'
import MaintenanceCard from './components/MaintenanceCard'
import RegionalSettingsCard from './components/RegionalSettingsCard'

type GlobalSettingsFormProps = {
  guildId: string
  savedSettings: TGlobalSettingsFormValues
}

const GlobalSettingsForm = ({
  guildId,
  savedSettings
}: GlobalSettingsFormProps) => {
  const form = useForm<
    TGlobalSettingsFormInput,
    unknown,
    TGlobalSettingsFormValues
  >({
    resolver: zodResolver(globalSettingsFormSchema),
    defaultValues: savedSettings,
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  })

  const onSubmit = async (values: TGlobalSettingsFormValues) => {
    const toastId = toast.loading('Saving global settings...')
    try {
      await saveGlobalSettings(guildId, values)
      form.reset(values)
      toast.success('Global settings saved!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to save global settings', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsFormLayout>
            <MaintenanceCard />
            <FeatureSwitchesCard />
            <RegionalSettingsCard />
          </SettingsFormLayout>
          <FormActionsFooter />
        </form>
      </Form>
    </FormProvider>
  )
}

export default GlobalSettingsForm
