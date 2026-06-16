'use client'

import { AlertTriangle } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { TGlobalSettingsFormInput } from '@/types/types'

const MaintenanceCard = () => {
  const form = useFormContext<TGlobalSettingsFormInput>()

  return (
    <Card className="gap-4 border-amber-500/40 py-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-4" />
          Maintenance mode
        </CardTitle>
        <CardDescription>
          Blocks most bot features for regular members. Discord server
          administrators can still use commands to recover configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <FormField
          control={form.control}
          name="maintenanceMode"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
              <div className="space-y-0.5 pr-4">
                <Label>Enable maintenance mode</Label>
                <p className="text-xs text-muted-foreground">
                  Use during outages or config changes. Turn off when the server
                  is ready for players again.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default MaintenanceCard
