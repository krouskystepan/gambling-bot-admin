'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { saveManagerRole } from '@/actions/database/managerRole.action'
import SaveButton from '@/components/SaveButton'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { managerRoleFormSchema } from '@/types/schemas'
import { IGuildRole, TManagerRoleValues } from '@/types/types'

type ManagerFormProps = {
  guildId: string
  roles: IGuildRole[]
  savedRoleId: string
}

const ManagerSettingsForm = ({
  guildId,
  roles,
  savedRoleId
}: ManagerFormProps) => {
  const form = useForm<TManagerRoleValues>({
    resolver: zodResolver(managerRoleFormSchema),
    defaultValues: {
      managerRoleId: savedRoleId
    }
  })

  const onSubmit = async (values: TManagerRoleValues) => {
    const toastId = toast.loading('Saving...')
    try {
      await saveManagerRole(guildId, values.managerRoleId)
      toast.success('Manager role saved!', { id: toastId })
    } catch {
      toast.error('Failed to save manager role', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="managerRoleId"
            render={({ field }) => (
              <FormItem>
                <Label>Manager Role</Label>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-muted border-transparent shadow-none">
                      <SelectValue placeholder="Select Manager Role" />
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

          <SaveButton />
        </form>
      </Form>
    </FormProvider>
  )
}

export default ManagerSettingsForm
