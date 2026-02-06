'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  calculateRTP,
  defaultCasinoSettings,
  readableGameNames,
  readableGameValueNames
} from 'gambling-bot-shared'
import { FormProvider, Path, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { saveCasinoSettings } from '@/actions/database/casinoSettings.action'
import SaveButton from '@/components/SaveButton'
import { Form } from '@/components/ui/form'
import { getReadableName } from '@/lib/utils'
import { casinoSettingsSchema } from '@/types/schemas'
import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

import { GAME_RECORD_FIELDS, GameWithRecords } from './config'
import { NumberField } from './fields/NumberField'
import { RecordFields } from './fields/RecordFields'
import { MultiRTP } from './rtp/MultiRTP'
import { SingleRTP } from './rtp/SingleRTP'

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

  const watchedValues = useWatch({ control: form.control })

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
          className="flex max-w-7xl w-full flex-col gap-6"
        >
          {(
            Object.keys(watchedValues) as Array<keyof TCasinoSettingsValues>
          ).map((game) => {
            const settings = watchedValues[game]
            if (!settings) return null

            const rtp = calculateRTP(
              game,
              settings as TCasinoSettingsValues[typeof game]
            )

            return (
              <section key={game} className="flex flex-col gap-4">
                <h4 className="text-xl font-semibold text-yellow-400">
                  {getReadableName(game, readableGameNames)}{' '}
                  {typeof rtp === 'number' ? (
                    <SingleRTP value={rtp} />
                  ) : (
                    <MultiRTP rtpMap={rtp} />
                  )}
                </h4>

                <div className="grid grid-cols-4 gap-3">
                  {(Object.keys(settings) as Array<keyof typeof settings>)
                    .filter((key) => typeof settings[key] === 'number')
                    .map((key) => (
                      <NumberField
                        key={String(key)}
                        form={form}
                        name={`${game}.${key}` as Path<TCasinoSettingsValues>}
                        label={getReadableName(
                          String(key),
                          readableGameValueNames
                        )}
                        defaultValue={
                          defaultCasinoSettings[game][
                            key as keyof (typeof defaultCasinoSettings)[typeof game]
                          ] as number
                        }
                      />
                    ))}
                </div>

                {(game as keyof typeof GAME_RECORD_FIELDS) in
                  GAME_RECORD_FIELDS &&
                  GAME_RECORD_FIELDS[game as GameWithRecords].map(
                    (recordKey) => (
                      <RecordFields
                        key={recordKey}
                        game={game as GameWithRecords}
                        recordKey={recordKey}
                        values={
                          settings[
                            recordKey as keyof typeof settings
                          ] as Record<string, number>
                        }
                        form={form}
                      />
                    )
                  )}
              </section>
            )
          })}

          <SaveButton />
        </form>
      </Form>
    </FormProvider>
  )
}
