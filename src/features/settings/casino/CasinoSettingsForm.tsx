'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { saveCasinoSettings } from '@/actions/database/casinoSettings.action'
import SaveButton from '@/components/SaveButton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Form } from '@/components/ui/form'
import { casinoSettingsSchema } from '@/types/schemas'
import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

import GameHeader from './GameHeader'
import GameSection from './GameSection'

type Props = {
  guildId: string
  savedSettings: TCasinoSettingsValues
}

export default function CasinoSettingsForm({ guildId, savedSettings }: Props) {
  const form = useForm<TCasinoSettingsOutput>({
    resolver: zodResolver(casinoSettingsSchema),
    defaultValues: savedSettings,
    mode: 'onBlur'
  })

  const onSubmit = async (values: TCasinoSettingsValues) => {
    const toastId = toast.loading('Saving...')
    try {
      await saveCasinoSettings(guildId, values)
      toast.success('Casino settings saved!', { id: toastId })
    } catch {
      toast.error('Failed to save casino settings', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full max-w-7xl flex-col gap-3"
        >
          <Accordion type="multiple" className="rounded-lg border">
            {(
              Object.keys(savedSettings) as Array<keyof TCasinoSettingsValues>
            ).map((game) => (
              <AccordionItem
                className="border-b px-4 last:border-b-0"
                key={game}
                value={String(game)}
              >
                <AccordionTrigger className="group hover:no-underline">
                  <GameHeader game={game} form={form} />
                </AccordionTrigger>
                <AccordionContent>
                  <GameSection game={game} form={form} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <SaveButton />
        </form>
      </Form>
    </FormProvider>
  )
}
