'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { saveVipSettings } from '@/actions/database/vipSettings.action'
import SaveButton from '@/components/SaveButton'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { vipSettingsFormSchema } from '@/types/schemas'
import { IGuildChannel, IGuildRole, TVipSettingsValues } from '@/types/types'

type Props = {
  guildId: string
  roles: IGuildRole[]
  categories: IGuildChannel[]
  savedSettings: TVipSettingsValues
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
      toast.success('VIP settings saved!', { id: toastId })
    } catch {
      toast.error('Failed to save VIP settings', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex max-w-4xl w-full flex-col gap-4"
        >
          <h4 className="text-xl font-semibold text-yellow-400">
            Roles and Categories
          </h4>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="roleOwnerId"
              render={({ field }) => (
                <FormItem>
                  <Label>Owner VIP Role</Label>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-muted border-transparent shadow-none">
                        <SelectValue placeholder="Select Owner VIP Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => {
                          const hex = `#${role.color
                            .toString(16)
                            .padStart(6, '0')}`

                          return (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: hex }}
                                />
                                <span>{role.name}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-muted border-transparent shadow-none">
                        <SelectValue placeholder="Select Member VIP Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => {
                          const hex = `#${role.color
                            .toString(16)
                            .padStart(6, '0')}`

                          return (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: hex }}
                                />
                                <span>{role.name}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-muted border-transparent shadow-none">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <h4 className="text-xl font-semibold text-yellow-400">Prices</h4>

          <div className="grid grid-cols-4 gap-4">
            {(
              [
                ['pricePerDay', 'Price per Day'],
                ['pricePerCreate', 'Price per Create'],
                ['pricePerAdditionalMember', 'Price per Additional Member'],
                ['maxMembers', 'Max Members']
              ] as const
            ).map(([name, label]) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <Label>{label}</Label>
                    <FormControl>
                      <Input
                        className="bg-muted border-transparent shadow-none"
                        type="text"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(
                            Number(e.target.value.replace(/\D/g, ''))
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <SaveButton />
        </form>
      </Form>
    </FormProvider>
  )
}

export default VipSettingsForm
