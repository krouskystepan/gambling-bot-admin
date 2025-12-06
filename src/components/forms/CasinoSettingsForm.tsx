'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider, Path, UseFormReturn } from 'react-hook-form'
import { useEffect } from 'react'
import { Form, FormField, FormItem, FormControl, FormMessage } from '../ui/form'
import { Label } from '../ui/label'
import SaveButton from '../SaveButton'
import { toast } from 'sonner'
import { casinoSettingsSchema } from '@/types/schemas'
import { Input } from '../ui/input'
import { RotateCw, TriangleAlert } from 'lucide-react'
import { Button } from '../ui/button'
import { TCasinoSettingsValues } from '@/types/types'
import z from 'zod'
import {
  getCasinoSettings,
  saveCasinoSettings,
} from '@/actions/database/casinoSettings.action'
import { getReadableName } from '@/lib/utils'
import {
  defaultCasinoSettings,
  calculateRTP,
  readableGameValueNames,
  readableGameNames,
} from 'gambling-bot-shared'

type NestedGameKeys = 'winMultipliers' | 'symbolWeights'

const NestedFields = ({
  game,
  settings,
  nestedKeys,
  form,
}: {
  game: keyof Pick<TCasinoSettingsValues, 'slots' | 'lottery' | 'roulette'>
  settings: Record<string, unknown>
  nestedKeys: NestedGameKeys[]
  form: UseFormReturn<
    z.input<typeof casinoSettingsSchema>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    z.output<typeof casinoSettingsSchema>
  >
}) => {
  return (
    <div className="grid grid-cols-1 gap-3">
      {nestedKeys.map((nestedKey) => {
        if (!(nestedKey in settings)) return null
        const nestedObj = settings[nestedKey] as Record<string, number>

        return (
          <div
            key={nestedKey}
            className="grid gap-3 mt-2"
            style={{
              gridTemplateColumns: `repeat(${
                Object.keys(nestedObj).length
              }, minmax(0,1fr))`,
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
                          className="bg-muted text-destructive/60 inline-flex w-9 items-center justify-center rounded-none rounded-e-md text-sm outline-none focus:z-10 hover:text-destructive duration-200 transition-colors cursor-pointer"
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
    defaultValues: defaultCasinoSettings,
  })

  const watchedValues = form.watch()

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
          className="flex flex-col gap-4 w-full"
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
                    <span className="text-xs text-gray-400 flex gap-1">
                      {`RTP: ${rtp.toFixed(2)}%`}
                      {rtp > 95 && (
                        <span className="text-red-500 flex gap-0.5">
                          <TriangleAlert size={16} /> (≥ 95%)
                        </span>
                      )}
                    </span>
                  ) : (
                    <div className="text-xs text-gray-400 flex flex-wrap gap-1">
                      <span className="font-medium">RTPs:</span>
                      {Object.entries(rtp).flatMap(([bet, value], i) => [
                        i > 0 && <span key={`sep-${i}`}>|</span>,
                        <span key={bet} className="flex gap-1">
                          {`${bet}: ${value.toFixed(2)}%`}
                          {value > 95 && (
                            <span className="text-red-500 flex gap-0.5">
                              <TriangleAlert size={16} /> (≥ 95%)
                            </span>
                          )}
                        </span>,
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
                                      className="bg-muted text-destructive/60 inline-flex w-9 items-center justify-center rounded-none rounded-e-md text-sm outline-none focus:z-10 hover:text-destructive duration-200 transition-colors cursor-pointer"
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
