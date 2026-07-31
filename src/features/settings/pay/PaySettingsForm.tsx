'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { parseReadableStringToNumber } from 'gambling-bot-shared/common'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { savePaySettings } from '@/actions/database/paySettings.action'
import SettingsFormLayout from '@/components/form/SettingsFormLayout'
import FormActionsFooter from '@/components/page/FormActionsFooter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { paySettingsSchema } from '@/types/schemas'
import { TPaySettingsInput, TPaySettingsValues } from '@/types/types'

type Props = {
  guildId: string
  savedSettings: TPaySettingsValues
}

const parseMoneyInput = (raw: string): number | null => {
  const trimmed = raw.trim()
  if (trimmed === '') return 0
  const parsed = parseReadableStringToNumber(trimmed)
  if (Number.isNaN(parsed)) return null
  return parsed
}

const FIELD_META: {
  name: keyof TPaySettingsValues
  label: string
  description: string
  money?: boolean
}[] = [
  {
    name: 'feePercent',
    label: 'Fee (%)',
    description:
      'Fraction 0–1 (e.g. 0.02 = 2%). Sender pays the fee; it is burned from the economy.'
  },
  {
    name: 'minAmount',
    label: 'Min amount',
    description: 'Minimum transfer size. 0 = uncapped (hard floor remains $1).',
    money: true
  },
  {
    name: 'maxAmount',
    label: 'Max amount',
    description: 'Maximum transfer size. 0 = uncapped.',
    money: true
  },
  {
    name: 'maxDailyAmount',
    label: 'Max daily amount',
    description:
      'Max sum of transfer volume per sender per guild day. 0 = uncapped.',
    money: true
  }
]

const PaySettingsForm = ({ guildId, savedSettings }: Props) => {
  const form = useForm<TPaySettingsInput, unknown, TPaySettingsValues>({
    resolver: zodResolver(paySettingsSchema),
    defaultValues: savedSettings
  })

  const onSubmit = async (values: TPaySettingsValues) => {
    const toastId = toast.loading('Saving pay settings...')
    try {
      await savePaySettings(guildId, values)
      form.reset(values)
      toast.success('Pay settings saved!', { id: toastId })
    } catch {
      toast.error('Failed to save pay settings', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsFormLayout
            actions={<FormActionsFooter label="Save pay settings" />}
          >
            <Card className="gap-4 py-4">
              <CardHeader className="pb-0">
                <CardTitle>Peer transfers (/pay)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {FIELD_META.map(({ name, label, description, money }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <Label>{label}</Label>
                          <FormControl>
                            <Input
                              variant="muted"
                              type="text"
                              placeholder={
                                money ? 'e.g. 1000, 2k, 4.5k' : 'e.g. 0.02'
                              }
                              value={field.value}
                              onChange={(e) => {
                                if (money) {
                                  const parsed = parseMoneyInput(e.target.value)
                                  if (parsed !== null) {
                                    field.onChange(parsed)
                                  }
                                  return
                                }

                                const raw = e.target.value.trim()
                                if (raw === '') {
                                  field.onChange(0)
                                  return
                                }
                                const parsed = Number(raw)
                                if (!Number.isNaN(parsed)) {
                                  field.onChange(parsed)
                                }
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            {description}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </SettingsFormLayout>
        </form>
      </Form>
    </FormProvider>
  )
}

export default PaySettingsForm
