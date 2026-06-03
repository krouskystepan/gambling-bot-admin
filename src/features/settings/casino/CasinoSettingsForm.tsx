'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { saveCasinoSettings } from '@/actions/database/casinoSettings.action'
import FormActionsFooter from '@/components/FormActionsFooter'
import { Form } from '@/components/ui/form'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { casinoSettingsSchema } from '@/types/schemas'
import { TCasinoSettingsInput, TCasinoSettingsValues } from '@/types/types'

import GameDetailPanel from './GameDetailPanel'
import GameNavList from './GameNavList'
import { sortCasinoGamesForNav } from './useGameRtp'

type Props = {
  guildId: string
  savedSettings: TCasinoSettingsValues
}

export default function CasinoSettingsForm({ guildId, savedSettings }: Props) {
  const games = useMemo(
    () =>
      sortCasinoGamesForNav(
        Object.keys(savedSettings) as Array<keyof TCasinoSettingsValues>
      ),
    [savedSettings]
  )

  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()

  const resolveGame = useCallback(
    (param: string | null): keyof TCasinoSettingsValues => {
      if (param && games.includes(param as keyof TCasinoSettingsValues)) {
        return param as keyof TCasinoSettingsValues
      }
      return games[0]
    },
    [games]
  )

  const selectedGame = resolveGame(searchParams.get('game'))

  const handleSelectGame = (game: keyof TCasinoSettingsValues) => {
    updateUrl({ game })
  }

  const form = useForm<TCasinoSettingsInput, unknown, TCasinoSettingsValues>({
    resolver: zodResolver(casinoSettingsSchema),
    defaultValues: savedSettings,
    mode: 'onBlur'
  })

  const onSubmit = async (values: TCasinoSettingsValues) => {
    const toastId = toast.loading('Saving...')
    try {
      await saveCasinoSettings(guildId, values)
      form.reset(values)
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
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start">
            <GameNavList
              games={games}
              selectedGame={selectedGame}
              form={form}
              onSelectGame={handleSelectGame}
            />
            <GameDetailPanel game={selectedGame} form={form} />
          </div>

          <FormActionsFooter
            label="Save casino settings"
            hint="Saves RTP and limits for all games"
          />
        </form>
      </Form>
    </FormProvider>
  )
}
