'use client'

import { COMMON_TIMEZONES } from 'gambling-bot-shared'
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
          Timezone is stored for scheduling and reporting. Currency symbol is
          shown in Discord embeds today; ISO code is for admin reference and
          future formatting.
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
          name="currencyCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency code (ISO 4217)</FormLabel>
              <FormControl>
                <Input
                  variant="muted"
                  maxLength={3}
                  placeholder="USD"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
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
      </CardContent>
    </Card>
  )
}

export default RegionalSettingsCard
