'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { saveManagerRole } from '@/actions/database/managerRole.action'
import FormActionsFooter from '@/components/FormActionsFooter'
import SettingsFormLayout from '@/components/form/SettingsFormLayout'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { managerRoleFormSchema } from '@/types/schemas'
import { IGuildRole, TManagerRoleValues } from '@/types/types'

import ManagerAccessOverview from './ManagerAccessOverview'

type ManagerFormProps = {
  guildId: string
  roles: IGuildRole[]
  savedRoleId: string
}

function roleColorHex(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`
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

  const selectedRoleId = form.watch('managerRoleId')
  const selectedRole = roles.find((role) => role.id === selectedRoleId)

  const onSubmit = async (values: TManagerRoleValues) => {
    const toastId = toast.loading('Saving...')
    try {
      await saveManagerRole(guildId, values.managerRoleId)
      form.reset(values)
      toast.success('Manager role saved!', { id: toastId })
    } catch {
      toast.error('Failed to save manager role', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsFormLayout
            layoutClassName="grid gap-6 lg:grid-cols-2 lg:items-start"
            actions={<FormActionsFooter label="Save manager role" />}
          >
            <Card className="gap-4 py-4">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Manager role
                </CardTitle>
                <CardDescription>
                  Choose which Discord role can use manager tools in the admin
                  panel and bot. Members still need that role assigned in your
                  server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <FormField
                  control={form.control}
                  name="managerRoleId"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Discord role</Label>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger variant="muted" className="w-full">
                            <SelectValue placeholder="Select manager role" />
                          </SelectTrigger>
                          <SelectContent>
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
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Pick a dedicated staff role rather than @everyone or a
                        broad member role.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedRole ? (
                  <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: roleColorHex(selectedRole.color)
                      }}
                    />
                    <span className="text-muted-foreground">Selected:</span>
                    <span className="font-medium">{selectedRole.name}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <ManagerAccessOverview />
          </SettingsFormLayout>
        </form>
      </Form>
    </FormProvider>
  )
}

export default ManagerSettingsForm
