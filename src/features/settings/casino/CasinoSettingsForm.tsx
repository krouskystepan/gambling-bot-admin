'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useMemo } from 'react'

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

const GAME_ORDER: Array<keyof TCasinoSettingsValues> = [
  'blackjack',
  'raffle',
  'prediction',
  'rps',
  'slots',
  'plinko',
  'lottery',
  'roulette',
  'goldenJackpot',
  'coinflip',
  'dice'
]

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

  const orderMap = useMemo(
    () => new Map(GAME_ORDER.map((game, index) => [game, index])),
    []
  )

  const games = useMemo(() => {
    return (
      Object.keys(savedSettings) as Array<keyof TCasinoSettingsValues>
    ).sort((a, b) => {
      const indexA = orderMap.get(a)
      const indexB = orderMap.get(b)

      if (indexA !== undefined && indexB !== undefined) return indexA - indexB

      if (indexA !== undefined) return -1
      if (indexB !== undefined) return 1

      return a.localeCompare(b)
    })
  }, [savedSettings, orderMap])

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full max-w-7xl flex-col gap-3"
        >
          <Accordion type="multiple" className="rounded-lg border">
            {games.map((game) => (
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
