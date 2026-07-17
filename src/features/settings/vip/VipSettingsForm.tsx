'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { parseReadableStringToNumber } from 'gambling-bot-shared/common'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { saveVipSettings } from '@/actions/database/vipSettings.action'
import OptionalSelect from '@/components/form/OptionalSelect'
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
import { SelectItem } from '@/components/ui/select'
import { vipSettingsFormSchema } from '@/types/schemas'
import { IGuildChannel, IGuildRole, TVipSettingsValues } from '@/types/types'

type Props = {
  guildId: string
  roles: IGuildRole[]
  categories: IGuildChannel[]
  savedSettings: TVipSettingsValues
}

const VIP_PRICE_FIELDS = [
  'pricePerDay',
  'pricePerCreate',
  'pricePerAdditionalMember'
] as const

function roleColorHex(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`
}

const parseVipPriceInput = (raw: string): number | null => {
  const trimmed = raw.trim()
  if (trimmed === '') return 0
  const parsed = parseReadableStringToNumber(trimmed)
  if (Number.isNaN(parsed)) return null
  return parsed
}

const VipSettingsForm = ({
  guildId,
  roles,
  categories,
  savedSettings
}: Props) => {
  const form = useForm<TVipSettingsValues>({
    resolver: zodResolver(vipSettingsFormSchema),
    defaultValues: savedSettings
  })

  const onSubmit = async (values: TVipSettingsValues) => {
    const toastId = toast.loading('Saving VIP settings...')
    try {
      await saveVipSettings(guildId, values)
      form.reset(values)
      toast.success('VIP settings saved!', { id: toastId })
    } catch {
      toast.error('Failed to save VIP settings', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsFormLayout
            actions={<FormActionsFooter label="Save VIP settings" />}
          >
            <Card className="gap-4 py-4">
              <CardHeader className="pb-0">
                <CardTitle>Roles and categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="roleOwnerId"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Owner VIP Role</Label>
                        <FormControl>
                          <OptionalSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Owner VIP Role"
                          >
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                      backgroundColor: roleColorHex(role.color)
                                    }}
                                  />
                                  <span>{role.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </OptionalSelect>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roleMemberId"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Member VIP Role</Label>
                        <FormControl>
                          <OptionalSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Member VIP Role"
                          >
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                      backgroundColor: roleColorHex(role.color)
                                    }}
                                  />
                                  <span>{role.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </OptionalSelect>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <Label>VIP Category</Label>
                        <FormControl>
                          <OptionalSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Category"
                          >
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </OptionalSelect>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="gap-4 py-4">
              <CardHeader className="pb-0">
                <CardTitle>Prices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ['pricePerDay', 'Price per Day'],
                      ['pricePerCreate', 'Price per Create'],
                      [
                        'pricePerAdditionalMember',
                        'Price per Additional Member'
                      ],
                      ['maxMembers', 'Max Members']
                    ] as const
                  ).map(([name, label]) => {
                    const isPriceField = (
                      VIP_PRICE_FIELDS as readonly string[]
                    ).includes(name)

                    return (
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
                                  isPriceField
                                    ? 'e.g. 1000, 2k, 4.5k'
                                    : undefined
                                }
                                value={field.value}
                                onChange={(e) => {
                                  if (!isPriceField) {
                                    field.onChange(
                                      Number(e.target.value.replace(/\D/g, ''))
                                    )
                                    return
                                  }

                                  const parsed = parseVipPriceInput(
                                    e.target.value
                                  )
                                  if (parsed !== null) {
                                    field.onChange(parsed)
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </SettingsFormLayout>
        </form>
      </Form>
    </FormProvider>
  )
}

export default VipSettingsForm
