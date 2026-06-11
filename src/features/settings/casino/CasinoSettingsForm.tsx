'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useCallback, useMemo } from 'react'

import { useSearchParams } from 'next/navigation'

import { saveCasinoSettings } from '@/actions/database/casinoSettings.action'
import FormActionsFooter from '@/components/FormActionsFooter'
import SettingsFormLayout from '@/components/form/SettingsFormLayout'
import { Form } from '@/components/ui/form'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { casinoSettingsSchema } from '@/types/schemas'
import { TCasinoSettingsInput, TCasinoSettingsValues } from '@/types/types'

import GameDetailPanel from './GameDetailPanel'
import GameNavList from './GameNavList'
import { NON_GAME_CASINO_SECTIONS, sortCasinoGamesForNav } from './useGameRtp'

type Props = {
  guildId: string
  savedSettings: TCasinoSettingsValues
}

export default function CasinoSettingsForm({ guildId, savedSettings }: Props) {
  const allKeys = useMemo(
    () => Object.keys(savedSettings) as Array<keyof TCasinoSettingsValues>,
    [savedSettings]
  )

  const games = useMemo(
    () =>
      sortCasinoGamesForNav(
        allKeys.filter((key) => !NON_GAME_CASINO_SECTIONS.includes(key))
      ),
    [allKeys]
  )

  const announcementSections = useMemo(
    () => NON_GAME_CASINO_SECTIONS.filter((key) => allKeys.includes(key)),
    [allKeys]
  )

  const navKeys = useMemo(
    () => [...games, ...announcementSections],
    [games, announcementSections]
  )

  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()

  const resolveGame = useCallback(
    (param: string | null): keyof TCasinoSettingsValues => {
      if (param && navKeys.includes(param as keyof TCasinoSettingsValues)) {
        return param as keyof TCasinoSettingsValues
      }
      return games[0]
    },
    [games, navKeys]
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsFormLayout
            actions={
              <FormActionsFooter
                label="Save casino settings"
                hint="Saves RTP and limits for all games"
              />
            }
          >
            <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
              <GameNavList
                games={games}
                sections={
                  announcementSections.length > 0
                    ? {
                        title: 'Announcements',
                        items: announcementSections
                      }
                    : undefined
                }
                selectedGame={selectedGame}
                form={form}
                onSelectGame={handleSelectGame}
              />
              <GameDetailPanel game={selectedGame} form={form} />
            </div>
          </SettingsFormLayout>
        </form>
      </Form>
    </FormProvider>
  )
}
