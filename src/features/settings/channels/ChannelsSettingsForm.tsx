'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { saveChannels } from '@/actions/database/channels.action'
import SaveButton from '@/components/SaveButton'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  atmChannelsFormSchema,
  casinoChannelsFormSchema,
  predictionChannelsFormSchema,
  raffleChannelsFormSchema
} from '@/types/schemas'
import { IGuildChannel, TChannelsFormValues } from '@/types/types'

const channelsFormSchema = z.object({
  atm: atmChannelsFormSchema,
  casino: casinoChannelsFormSchema,
  prediction: predictionChannelsFormSchema,
  raffle: raffleChannelsFormSchema
})

type ChannelsFormProps = {
  guildId: string
  guildChannels: IGuildChannel[]
  savedChannels: {
    atm: { actions: string; logs: string }
    casino: { casinoChannelIds: string[] }
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
        casinoChannelIds: savedChannels?.casino?.casinoChannelIds ?? []
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
      toast.success('Channels saved!', { id: toastId })
    } catch {
      toast.error('Failed to save channels', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-lg max-w-lg flex-col gap-4"
        >
          <section className="flex flex-col gap-4">
            <h4 className="text-xl font-semibold text-yellow-400">
              ATM Channels
            </h4>
            <div className="grid w-full grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="atm.actions"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Label>ATM Actions</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted border-transparent shadow-none">
                          <SelectValue placeholder="Select Action Channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guildChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormItem className="flex-1">
                    <Label>ATM Logs</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted border-transparent shadow-none">
                          <SelectValue placeholder="Select Logs Channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guildChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select channel for ATM Logs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="flex w-full flex-col gap-4">
            <h4 className="text-xl font-semibold text-yellow-400">
              Casino Channels
            </h4>
            <FormField
              control={form.control}
              name="casino.casinoChannelIds"
              render={({ field }) => (
                <FormItem>
                  <Label>Casino Channels</Label>
                  <FormControl>
                    <MultipleSelector
                      className="bg-muted border-transparent shadow-none"
                      commandProps={{
                        label: 'Select channels',
                        shouldFilter: false
                      }}
                      placeholder="Select Casino Channels"
                      hidePlaceholderWhenSelected
                      emptyIndicator={
                        <p className="text-center text-sm">No results found</p>
                      }
                      value={(field.value ?? []).map((id: string) => {
                        const channel = guildChannels.find((c) => c.id === id)
                        return { label: channel?.name ?? id, value: id }
                      })}
                      defaultOptions={guildChannels.map((channel) => ({
                        label: channel.name,
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
                            label: c.name,
                            value: c.id
                          }))
                        }

                        const filtered = guildChannels
                          .filter((c) => c.name.toLowerCase().includes(term))
                          .map((c) => ({ label: c.name, value: c.id }))

                        return filtered
                      }}
                      key={guildChannels.length}
                    />
                  </FormControl>
                  <FormDescription>
                    Select channel(s) for Casino Channels
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="flex flex-col gap-4">
            <h4 className="text-xl font-semibold text-yellow-400">
              Prediction Channels
            </h4>
            <div className="grid w-full grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="prediction.actions"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Label>Prediction Actions</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted border-transparent shadow-none">
                          <SelectValue placeholder="Select Action Channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guildChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormItem className="flex-1">
                    <Label>Prediction Logs</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted border-transparent shadow-none">
                          <SelectValue placeholder="Select Logs Channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guildChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select channel for Prediction Logs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h4 className="text-xl font-semibold text-yellow-400">
              Raffle Channels
            </h4>
            <div className="grid w-full grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="raffle.actions"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Label>Raffle Actions</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted border-transparent shadow-none">
                          <SelectValue placeholder="Select Action Channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guildChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormItem className="flex-1">
                    <Label>Raffle Logs</Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted border-transparent shadow-none">
                          <SelectValue placeholder="Select Logs Channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guildChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select channel for Raffle Logs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <SaveButton />
        </form>
      </Form>
    </FormProvider>
  )
}

export default ChannelsSettingsForm
