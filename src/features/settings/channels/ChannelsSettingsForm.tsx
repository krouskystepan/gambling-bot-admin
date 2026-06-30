'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { saveChannels } from '@/actions/database/channels.action'
import OptionalSelect from '@/components/form/OptionalSelect'
import SettingsFormLayout from '@/components/form/SettingsFormLayout'
import FormActionsFooter from '@/components/page/FormActionsFooter'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import MultipleSelector from '@/components/ui/multiselect'
import { SelectItem } from '@/components/ui/select'
import { channelsFormSchema } from '@/types/schemas'
import { IGuildChannel, TChannelsFormValues } from '@/types/types'

type ChannelsFormProps = {
  guildId: string
  guildChannels: IGuildChannel[]
  savedChannels: {
    atm: { actions: string; logs: string }
    casino: { casinoChannelIds: string[]; winAnnouncementsChannelId: string }
    prediction: { actions: string; logs: string }
    raffle: { actions: string; logs: string }
  } | null
}

const ChannelsSettingsForm = ({
  guildId,
  guildChannels,
  savedChannels
}: ChannelsFormProps) => {
  const form = useForm<TChannelsFormValues>({
    resolver: zodResolver(channelsFormSchema),
    defaultValues: {
      atm: {
        actions: savedChannels?.atm?.actions ?? '',
        logs: savedChannels?.atm?.logs ?? ''
      },
      casino: {
        casinoChannelIds: savedChannels?.casino?.casinoChannelIds ?? [],
        winAnnouncementsChannelId:
          savedChannels?.casino?.winAnnouncementsChannelId ?? ''
      },
      prediction: {
        actions: savedChannels?.prediction?.actions ?? '',
        logs: savedChannels?.prediction?.logs ?? ''
      },
      raffle: {
        actions: savedChannels?.raffle?.actions ?? '',
        logs: savedChannels?.raffle?.logs ?? ''
      }
    }
  })

  const onSubmit = async (values: TChannelsFormValues) => {
    const toastId = toast.loading('Saving...')

    try {
      await saveChannels(guildId, values)
      form.reset(values)
      toast.success('Channels saved!', { id: toastId })
    } catch {
      toast.error('Failed to save channels', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsFormLayout
            actions={
              <FormActionsFooter
                label="Save channel settings"
                hint="Applies to ATM, casino, prediction, and raffle"
              />
            }
          >
            <Card className="gap-4 py-4">
              <CardHeader className="pb-0">
                <CardTitle>ATM channels</CardTitle>
                <CardDescription>
                  Action and log channels for ATM activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="atm.actions"
                    render={({ field }) => (
                      <FormItem>
                        <Label>ATM Actions</Label>
                        <FormControl>
                          <OptionalSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Action Channel"
                          >
                            {guildChannels.map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                              </SelectItem>
                            ))}
                          </OptionalSelect>
                        </FormControl>
                        <FormDescription>
                          Select channel for ATM Actions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="atm.logs"
                    render={({ field }) => (
                      <FormItem>
                        <Label>ATM Logs</Label>
                        <FormControl>
                          <OptionalSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Logs Channel"
                          >
                            {guildChannels.map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                              </SelectItem>
                            ))}
                          </OptionalSelect>
                        </FormControl>
                        <FormDescription>
                          Select channel for ATM Logs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="gap-4 py-4">
              <CardHeader className="pb-0">
                <CardTitle>Casino channels</CardTitle>
                <CardDescription>
                  Channels where casino games can be played
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <FormField
                  control={form.control}
                  name="casino.casinoChannelIds"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Casino Channels</Label>
                      <FormControl>
                        <MultipleSelector
                          variant="muted"
                          commandProps={{
                            label: 'Select channels',
                            shouldFilter: false
                          }}
                          placeholder="Select Casino Channels"
                          hidePlaceholderWhenSelected
                          emptyIndicator={
                            <p className="text-center text-sm">
                              No results found
                            </p>
                          }
                          value={(field.value ?? []).map((id: string) => {
                            const channel = guildChannels.find(
                              (c) => c.id === id
                            )
                            return { label: channel?.name ?? id, value: id }
                          })}
                          defaultOptions={guildChannels.map((channel) => ({
                            label: channel.name ?? channel.id,
                            value: channel.id
                          }))}
                          onChange={(options) =>
                            field.onChange(options.map((opt) => opt.value))
                          }
                          selectFirstItem={false}
                          onSearchSync={(search) => {
                            const term = search.toLowerCase().trim()

                            if (!term) {
                              return guildChannels.map((c) => ({
                                label: c.name ?? c.id,
                                value: c.id
                              }))
                            }

                            return guildChannels
                              .filter((c) =>
                                (c.name ?? '').toLowerCase().includes(term)
                              )
                              .map((c) => ({
                                label: c.name ?? c.id,
                                value: c.id
                              }))
                          }}
                          key={guildChannels.length}
                        />
                      </FormControl>
                      <FormDescription>
                        Select channel(s) for casino games. Leave empty (None)
                        to disable.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="casino.winAnnouncementsChannelId"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Win announcements channel</Label>
                      <FormControl>
                        <OptionalSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="None (disabled)"
                        >
                          {guildChannels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.name}
                            </SelectItem>
                          ))}
                        </OptionalSelect>
                      </FormControl>
                      <FormDescription>
                        Posts public announcements when players hit configured
                        big wins in casino games
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="gap-4 py-4">
              <CardHeader className="pb-0">
                <CardTitle>Prediction channels</CardTitle>
                <CardDescription>
                  Action and log channels for predictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="prediction.actions"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Prediction Actions</Label>
                        <FormControl>
                          <OptionalSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Action Channel"
                          >
                            {guildChannels.map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                              </SelectItem>
                            ))}
                          </OptionalSelect>
                        </FormControl>
                        <FormDescription>
                          Select channel for Prediction Actions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prediction.logs"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Prediction Logs</Label>
                        <FormControl>
                          <OptionalSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Logs Channel"
                          >
                            {guildChannels.map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                              </SelectItem>
                            ))}
                          </OptionalSelect>
                        </FormControl>
                        <FormDescription>
                          Select channel for Prediction Logs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="gap-4 py-4">
              <CardHeader className="pb-0">
                <CardTitle>Raffle channels</CardTitle>
                <CardDescription>
                  Action and log channels for raffles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="raffle.actions"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Raffle Actions</Label>
                        <FormControl>
                          <OptionalSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Action Channel"
                          >
                            {guildChannels.map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                              </SelectItem>
                            ))}
                          </OptionalSelect>
                        </FormControl>
                        <FormDescription>
                          Select channel for Raffle Actions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="raffle.logs"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Raffle Logs</Label>
                        <FormControl>
                          <OptionalSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Logs Channel"
                          >
                            {guildChannels.map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                              </SelectItem>
                            ))}
                          </OptionalSelect>
                        </FormControl>
                        <FormDescription>
                          Select channel for Raffle Logs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </SettingsFormLayout>
        </form>
      </Form>
    </FormProvider>
  )
}

export default ChannelsSettingsForm
