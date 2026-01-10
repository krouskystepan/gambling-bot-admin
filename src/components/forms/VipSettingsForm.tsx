'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useEffect, useState } from 'react'

import {
  getVipSettings,
  saveVipSettings
} from '@/actions/database/vipSettings.action'
import { getGuildCategories } from '@/actions/discord/category.action'
import { getGuildRoles } from '@/actions/discord/role.action'
import { vipSettingsFormSchema } from '@/types/schemas'
import { IGuildChannel, IGuildRole, TVipSettingsValues } from '@/types/types'

import SaveButton from '../SaveButton'
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'

const VipSettingsForm = ({ guildId }: { guildId: string }) => {
  const form = useForm<TVipSettingsValues>({
    resolver: zodResolver(vipSettingsFormSchema),
    defaultValues: {
      roleOwnerId: '',
      roleMemberId: '',
      pricePerDay: 0,
      pricePerAdditionalMember: 0,
      maxMembers: 0,
      pricePerCreate: 0,
      categoryId: ''
    }
  })

  const [roles, setRoles] = useState<IGuildRole[]>([])
  const [categories, setCategories] = useState<IGuildChannel[]>([])
  const [, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guildRoles, guildCategories, vipConfig] = await Promise.all([
          getGuildRoles(guildId),
          getGuildCategories(guildId),
          getVipSettings(guildId)
        ])

        setRoles(guildRoles)
        setCategories(guildCategories)

        form.reset({
          roleOwnerId: vipConfig?.roleOwnerId ?? '',
          roleMemberId: vipConfig?.roleMemberId ?? '',
          categoryId: vipConfig?.categoryId ?? '',
          pricePerDay: vipConfig?.pricePerDay ?? 0,
          pricePerCreate: vipConfig?.pricePerCreate ?? 0,
          pricePerAdditionalMember: vipConfig?.pricePerAdditionalMember ?? 0,
          maxMembers: vipConfig?.maxMembers ?? 0
        })

        setLoading(false)
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [guildId, form])

  const onSubmit = async (values: TVipSettingsValues) => {
    const toastId = toast.loading('Saving VIP settings...')
    try {
      await saveVipSettings(guildId, values)
      toast.success('VIP settings saved!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to save VIP settings', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-1/2 flex-col gap-4"
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
                    <Select
                      key={field.value}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="bg-muted border-transparent shadow-none">
                        <SelectValue placeholder="Select Owner VIP Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => {
                          const hexColor = `#${role.color
                            .toString(16)
                            .padStart(6, '0')}`

                          return (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 shrink-0 rounded-full"
                                  style={{ backgroundColor: hexColor }}
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
                  <Label>Owner Member VIP Role</Label>
                  <FormControl>
                    <Select
                      key={field.value}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="bg-muted border-transparent shadow-none">
                        <SelectValue placeholder="Select VIP Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => {
                          const hexColor = `#${role.color
                            .toString(16)
                            .padStart(6, '0')}`
                          return (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 shrink-0 rounded-full"
                                  style={{ backgroundColor: hexColor }}
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
                    <Select
                      key={field.value}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
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
            <FormField
              control={form.control}
              name="pricePerDay"
              render={({ field }) => (
                <FormItem>
                  <Label>Price per Day</Label>
                  <FormControl>
                    <Input
                      className="bg-muted border-transparent shadow-none"
                      type="text"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        field.onChange(Number(value))
                      }}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricePerCreate"
              render={({ field }) => (
                <FormItem>
                  <Label>Price per Create</Label>
                  <FormControl>
                    <Input
                      className="bg-muted border-transparent shadow-none"
                      type="text"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        field.onChange(Number(value))
                      }}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerAdditionalMember"
              render={({ field }) => (
                <FormItem>
                  <Label>Price per Additional Member</Label>
                  <FormControl>
                    <Input
                      className="bg-muted border-transparent shadow-none"
                      type="text"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        field.onChange(Number(value))
                      }}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxMembers"
              render={({ field }) => (
                <FormItem>
                  <Label>Max Members in VIP Room</Label>
                  <FormControl>
                    <Input
                      className="bg-muted border-transparent shadow-none"
                      type="text"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        field.onChange(Number(value))
                      }}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <SaveButton />
        </form>
      </Form>
    </FormProvider>
  )
}

export default VipSettingsForm
