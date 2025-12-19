'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { Form, FormField, FormItem, FormControl, FormMessage } from '../ui/form'
import { Label } from '../ui/label'
import SaveButton from '../SaveButton'
import { toast } from 'sonner'
import { IGuildRole, TManagerRoleValues } from '@/types/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { managerRoleFormSchema } from '@/types/schemas'
import {
  getManagerRole,
  saveManagerRole
} from '@/actions/database/managerRole.action'
import { getGuildRoles } from '@/actions/discord/role.action'

const ManagerRoleForm = ({ guildId }: { guildId: string }) => {
  const form = useForm<TManagerRoleValues>({
    resolver: zodResolver(managerRoleFormSchema),
    defaultValues: {
      managerRoleId: ''
    }
  })

  const [roles, setRoles] = useState<IGuildRole[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guildRoles, config] = await Promise.all([
          getGuildRoles(guildId),
          getManagerRole(guildId)
        ])
        setRoles(guildRoles)

        form.reset({
          managerRoleId: config?.managerRoleId ?? ''
        })
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [guildId, form])

  const onSubmit = async (values: TManagerRoleValues) => {
    const toastId = toast.loading('Saving...')
    try {
      await saveManagerRole(guildId, values.managerRoleId)
      toast.success('Manager role saved!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to save manager role', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 w-1/3"
        >
          <section className="flex flex-col gap-4">
            <h4 className="text-xl font-semibold text-yellow-400">
              Manager Role
            </h4>
            <FormField
              control={form.control}
              name="managerRoleId"
              render={({ field }) => (
                <FormItem>
                  <Label>Manager Role</Label>
                  <FormControl>
                    <Select
                      key={field.value}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="bg-muted border-transparent shadow-none">
                        <SelectValue placeholder="Select Manager Role" />
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
                                  className="w-3 h-3 rounded-full shrink-0"
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
          </section>

          <SaveButton />
        </form>
      </Form>
    </FormProvider>
  )
}

export default ManagerRoleForm
