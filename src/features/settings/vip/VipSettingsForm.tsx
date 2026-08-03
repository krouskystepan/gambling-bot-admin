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
  FormDescription,
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

const FIELD_META: {
  name: keyof TVipSettingsValues
  label: string
  description: string
  money?: boolean
}[] = [
  {
    name: 'pricePerDay',
    label: 'Price per Day',
    description: 'Cost charged for each day of VIP duration (buy or extend).',
    money: true
  },
  {
    name: 'pricePerCreate',
    label: 'Price per Create',
    description:
      'One-time fee added when purchasing a new VIP room. 0 = no create fee.',
    money: true
  },
  {
    name: 'pricePerAdditionalMember',
    label: 'Price per Additional Member',
    description: 'Cost to add one extra member to an existing VIP room.',
    money: true
  },
  {
    name: 'maxMembers',
    label: 'Max Members',
    description:
      'Maximum members allowed in a VIP room (including the owner). 0 = uncapped.'
  }
]

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
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        <FormDescription className="text-xs">
                          Discord role given to the VIP room owner. Required for
                          VIP to work.
                        </FormDescription>
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
                        <FormDescription className="text-xs">
                          Discord role given to members added to a VIP room.
                          Required for VIP to work.
                        </FormDescription>
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
                        <FormDescription className="text-xs">
                          Category where private VIP voice/text channels are
                          created. Required for VIP to work.
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
                <CardTitle>Prices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                                money ? 'e.g. 1000, 2k, 4.5k' : undefined
                              }
                              value={field.value}
                              onChange={(e) => {
                                if (!money) {
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
                          <FormDescription className="text-xs">
                            {description}
                          </FormDescription>
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

export default VipSettingsForm
