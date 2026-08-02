'use client'

import { readableGameNames } from 'gambling-bot-shared/casino'
import { getReadableName } from 'gambling-bot-shared/common'
import { Path } from 'react-hook-form'

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
import {
  TCasinoSettingsForm,
  TCasinoSettingsInput,
  TCasinoSettingsValues
} from '@/types/types'

type Props = {
  games: Array<keyof TCasinoSettingsValues>
  form: TCasinoSettingsForm
}

const GameAccessCard = ({ games, form }: Props) => (
  <Card className="gap-4 py-4">
    <CardHeader className="pb-0">
      <CardTitle>Game access</CardTitle>
      <CardDescription>
        Disable individual games here. Global Feature access can still turn off
        all casino games at once.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-2 pt-0 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {games.map((game) => (
        <FormField
          key={String(game)}
          control={form.control}
          name={`${game}.enabled` as Path<TCasinoSettingsInput>}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0 rounded-lg border px-2.5 py-1.5">
              <Label
                htmlFor={`access-${game}-enabled`}
                className="cursor-pointer truncate"
              >
                {getReadableName(String(game), readableGameNames)}
              </Label>
              <FormControl>
                <Switch
                  id={`access-${game}-enabled`}
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </CardContent>
  </Card>
)

export default GameAccessCard
