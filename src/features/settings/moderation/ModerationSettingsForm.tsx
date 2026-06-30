'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Ban, ShieldCheck } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import Link from 'next/link'

import { saveModerationSettings } from '@/actions/database/moderationSettings.action'
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
import { SelectItem } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { managerRoleFormSchema } from '@/types/schemas'
import { IGuildRole, TManagerRoleValues } from '@/types/types'

import BannedAccessOverview from './BannedAccessOverview'
import ManagerAccessOverview from './ManagerAccessOverview'

type ModerationSettingsFormProps = {
  guildId: string
  roles: IGuildRole[]
  savedRoleId: string
  savedBannedRoleId: string
}

function roleColorHex(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`
}

const ModerationSettingsForm = ({
  guildId,
  roles,
  savedRoleId,
  savedBannedRoleId
}: ModerationSettingsFormProps) => {
  const form = useForm<TManagerRoleValues>({
    resolver: zodResolver(managerRoleFormSchema),
    defaultValues: {
      managerRoleId: savedRoleId,
      bannedRoleId: savedBannedRoleId
    }
  })

  const onSubmit = async (values: TManagerRoleValues) => {
    const toastId = toast.loading('Saving...')
    try {
      await saveModerationSettings(guildId, values)
      form.reset(values)
      toast.success('Moderation settings saved!', { id: toastId })
    } catch {
      toast.error('Failed to save moderation settings', { id: toastId })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsFormLayout
            layoutClassName="flex flex-col gap-6"
            actions={<FormActionsFooter label="Save moderation settings" />}
          >
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Ban className="size-4" />
                  Economy ban
                </h2>
                <p className="text-sm text-muted-foreground">
                  Restrict player economy actions and optionally assign a
                  Discord role on ban.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <Card className="gap-4 py-4">
                  <CardHeader className="pb-0">
                    <CardTitle>Banned player role</CardTitle>
                    <CardDescription>
                      Optional Discord role assigned on economy ban and removed
                      on unban.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <FormField
                      control={form.control}
                      name="bannedRoleId"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Discord role</Label>
                          <FormControl>
                            <OptionalSelect
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select banned role (optional)"
                              className="w-full"
                            >
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-3 w-3 rounded-full"
                                      style={{
                                        backgroundColor: roleColorHex(
                                          role.color
                                        )
                                      }}
                                    />
                                    <span>{role.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </OptionalSelect>
                          </FormControl>
                          <FormDescription>
                            Ban from the{' '}
                            <Link
                              href={`/dashboard/g/${guildId}/users`}
                              className="font-medium text-primary hover:underline"
                            >
                              users table
                            </Link>{' '}
                            or a profile. Leave empty to skip Discord role
                            changes.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <BannedAccessOverview />
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ShieldCheck className="size-4" />
                  Manager access
                </h2>
                <p className="text-sm text-muted-foreground">
                  Staff role for manager tools in the admin panel and Discord
                  bot.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <Card className="gap-4 py-4">
                  <CardHeader className="pb-0">
                    <CardTitle>Manager role</CardTitle>
                    <CardDescription>
                      Discord role that can use manager tools in the admin panel
                      and bot.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <FormField
                      control={form.control}
                      name="managerRoleId"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Discord role</Label>
                          <FormControl>
                            <OptionalSelect
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select manager role"
                              className="w-full"
                            >
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-3 w-3 rounded-full"
                                      style={{
                                        backgroundColor: roleColorHex(
                                          role.color
                                        )
                                      }}
                                    />
                                    <span>{role.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </OptionalSelect>
                          </FormControl>
                          <FormDescription>
                            Pick a dedicated staff role. Members still need it
                            assigned in Discord.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <ManagerAccessOverview />
              </div>
            </section>
          </SettingsFormLayout>
        </form>
      </Form>
    </FormProvider>
  )
}

export default ModerationSettingsForm
