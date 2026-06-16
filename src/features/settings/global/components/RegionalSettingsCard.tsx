'use client'

import { COMMON_TIMEZONES } from 'gambling-bot-shared/guild'
import { Globe } from 'lucide-react'
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
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { TGlobalSettingsFormInput } from '@/types/types'

const RegionalSettingsCard = () => {
  const form = useFormContext<TGlobalSettingsFormInput>()

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-4" />
          Regional
        </CardTitle>
        <CardDescription>
          Timezone is used for scheduling and reporting. Prefix puts the label
          before the amount ($1.5k); suffix puts it after (1.5kCZK). Add spaces
          in the label field yourself if you want them (e.g. &quot;$ &quot; or
          &quot; CZK&quot;).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger variant="muted">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currencySymbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency symbol</FormLabel>
              <FormControl>
                <Input
                  variant="muted"
                  maxLength={8}
                  placeholder="$"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currencyPlacement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount format</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger variant="muted">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="prefix">Symbol before amount</SelectItem>
                  <SelectItem value="suffix">Label after amount</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default RegionalSettingsCard
