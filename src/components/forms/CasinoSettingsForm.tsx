'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  calculateRTP,
  defaultCasinoSettings,
  readableGameNames,
  readableGameValueNames
} from 'gambling-bot-shared'
import { RotateCw, TriangleAlert } from 'lucide-react'
import {
  FormProvider,
  Path,
  UseFormReturn,
  useForm,
  useWatch
} from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useEffect } from 'react'

import {
  getCasinoSettings,
  saveCasinoSettings
} from '@/actions/database/casinoSettings.action'
import { getReadableName } from '@/lib/utils'
import { casinoSettingsSchema } from '@/types/schemas'
import { TCasinoSettingsValues } from '@/types/types'

import SaveButton from '../SaveButton'
import { Button } from '../ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

type NestedGameKeys = 'winMultipliers' | 'symbolWeights'

const NestedFields = ({
  game,
  settings,
  nestedKeys,
  form
}: {
  game: keyof Pick<TCasinoSettingsValues, 'slots' | 'lottery' | 'roulette'>
  settings: Record<string, unknown> | undefined
  nestedKeys: NestedGameKeys[]
  form: UseFormReturn<
    z.input<typeof casinoSettingsSchema>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    z.output<typeof casinoSettingsSchema>
  >
}) => {
  if (!settings) return null

  return (
    <div className="grid grid-cols-1 gap-3">
      {nestedKeys.map((nestedKey) => {
        if (!(nestedKey in settings)) return null
        const nestedObj = settings[nestedKey] as Record<string, number>

        return (
          <div
            key={nestedKey}
            className="mt-2 grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${
                Object.keys(nestedObj).length
              }, minmax(0,1fr))`
            }}
          >
            {Object.entries(nestedObj).map(([symbol]) => (
              <FormField
                key={symbol}
                control={form.control}
                name={
                  `${game}.${nestedKey}.${symbol}` as Path<TCasinoSettingsValues>
                }
                render={({ field }) => (
                  <FormItem>
                    <Label>
                      {nestedKey === 'winMultipliers'
                        ? `Payout for ${symbol}`
                        : `Weight for ${symbol}`}
                    </Label>
                    <FormControl>
                      <div className="flex rounded-md shadow-xs">
                        <Input
                          className="bg-muted rounded-r-none border-transparent shadow-none"
                          type="text"
                          value={(field.value as string) ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '')
                            field.onChange(val)
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                        <Button
                          type="reset"
                          variant="ghost"
                          className="bg-muted text-destructive/60 hover:text-destructive inline-flex w-9 cursor-pointer items-center justify-center rounded-none rounded-e-md text-sm transition-colors duration-200 outline-none focus:z-10"
                          onClick={() => {
                            const defaultGameSettings = defaultCasinoSettings[
                              game as keyof TCasinoSettingsValues
                            ] as Record<string, number>

                            const nestedDefault = defaultGameSettings[nestedKey]

                            if (
                              typeof nestedDefault === 'object' &&
                              nestedDefault !== null
                            ) {
                              const defaultValue = nestedDefault[symbol]
                              field.onChange(String(defaultValue))
                            }
                          }}
                        >
                          <RotateCw size={16} aria-hidden="true" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

const CasinoSettingsForm = ({ guildId }: { guildId: string }) => {
  const form = useForm<
    z.input<typeof casinoSettingsSchema>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    z.output<typeof casinoSettingsSchema>
  >({
    resolver: zodResolver(casinoSettingsSchema),
    defaultValues: defaultCasinoSettings
  })

  const watchedValues = useWatch({
    control: form.control
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getCasinoSettings(guildId)
        if (settings) {
          form.reset(settings)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchSettings()
  }, [guildId, form])

  const onSubmit = async (values: TCasinoSettingsValues) => {
    const toastId = toast.loading('Saving...')
    try {
      await saveCasinoSettings(guildId, values)
      toast.success('Casino settings saved!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to save casino settings', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-4"
        >
          {Object.entries(watchedValues).map(([game, settings]) => {
            const rtp = calculateRTP(
              game as keyof TCasinoSettingsValues,
              settings as TCasinoSettingsValues[keyof TCasinoSettingsValues]
            )

            return (
              <section key={game} className="flex flex-col gap-3">
                <h4 className="text-xl font-semibold text-yellow-400">
                  {getReadableName(game, readableGameNames)}{' '}
                  {typeof rtp === 'number' ? (
                    <span className="flex gap-1 text-xs text-gray-400">
                      {`RTP: ${rtp.toFixed(2)}%`}
                      {rtp > 95 && (
                        <span className="flex gap-0.5 text-red-500">
                          <TriangleAlert size={16} /> (≥ 95%)
                        </span>
                      )}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1 text-xs text-gray-400">
                      <span className="font-medium">RTPs:</span>
                      {Object.entries(rtp).flatMap(([bet, value], i) => [
                        i > 0 && <span key={`sep-${i}`}>|</span>,
                        <span key={bet} className="flex gap-1">
                          {`${bet}: ${value.toFixed(2)}%`}
                          {value > 95 && (
                            <span className="flex gap-0.5 text-red-500">
                              <TriangleAlert size={16} /> (≥ 95%)
                            </span>
                          )}
                        </span>
                      ])}
                    </div>
                  )}
                </h4>

                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(settings as Record<string, unknown>).map(
                    ([key, value]) => {
                      if (
                        typeof value === 'number' ||
                        typeof value === 'string'
                      ) {
                        return (
                          <FormField
                            key={key}
                            control={form.control}
                            name={
                              `${game}.${key}` as Path<TCasinoSettingsValues>
                            }
                            render={({ field }) => (
                              <FormItem>
                                <Label>
                                  {getReadableName(key, readableGameValueNames)}
                                </Label>
                                <FormControl>
                                  <div className="flex rounded-md shadow-xs">
                                    <Input
                                      className="bg-muted rounded-r-none border-transparent shadow-none"
                                      type="text"
                                      value={(field.value as string) ?? ''}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(
                                          /[^0-9.]/g,
                                          ''
                                        )
                                        field.onChange(val)
                                      }}
                                      onBlur={field.onBlur}
                                      name={field.name}
                                      ref={field.ref}
                                    />
                                    <Button
                                      type="reset"
                                      variant="ghost"
                                      className="bg-muted text-destructive/60 hover:text-destructive inline-flex w-9 cursor-pointer items-center justify-center rounded-none rounded-e-md text-sm transition-colors duration-200 outline-none focus:z-10"
                                      onClick={() => {
                                        const defaultValue = (
                                          defaultCasinoSettings[
                                            game as keyof TCasinoSettingsValues
                                          ] as Record<
                                            string,
                                            number | Record<string, number>
                                          >
                                        )[key]
                                        field.onChange(String(defaultValue))
                                      }}
                                    >
                                      <RotateCw size={16} aria-hidden="true" />
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )
                      }
                      return null
                    }
                  )}
                </div>

                {game === 'slots' && (
                  <NestedFields
                    game="slots"
                    settings={settings as Record<string, unknown>}
                    nestedKeys={['winMultipliers', 'symbolWeights']}
                    form={form}
                  />
                )}

                {game === 'lottery' && (
                  <NestedFields
                    game="lottery"
                    settings={watchedValues.lottery}
                    nestedKeys={['winMultipliers']}
                    form={form}
                  />
                )}

                {game === 'roulette' && (
                  <NestedFields
                    game="roulette"
                    settings={watchedValues.roulette}
                    nestedKeys={['winMultipliers']}
                    form={form}
                  />
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

export default CasinoSettingsForm
