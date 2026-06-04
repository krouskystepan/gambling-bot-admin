'use client'

import type { LucideIcon } from 'lucide-react'
import { Dices, Gift, Landmark, TrendingUp } from 'lucide-react'
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

type SwitchRow = {
  name: keyof TGlobalSettingsFormInput
  label: string
  description: string
}

const ATM_SWITCHES: SwitchRow[] = [
  {
    name: 'disableRegistrations',
    label: 'Disable registrations',
    description: 'Block /register for new users.'
  },
  {
    name: 'disableDeposits',
    label: 'Disable deposits',
    description: 'Block deposit requests in the ATM channel.'
  },
  {
    name: 'disableWithdrawals',
    label: 'Disable withdrawals',
    description: 'Block withdrawal requests in the ATM channel.'
  }
]

const CASINO_SWITCHES: SwitchRow[] = [
  {
    name: 'disableCasinoGames',
    label: 'Disable casino games',
    description: 'Block player casino commands in configured channels.'
  },
  {
    name: 'disableCasinoGamesForMods',
    label: 'Disable mod casino tools',
    description: 'Block dev simulate commands and similar mod casino utilities.'
  }
]

const EVENT_SWITCHES: SwitchRow[] = [
  {
    name: 'disablePredictions',
    label: 'Disable prediction betting',
    description: 'Users cannot place bets via prediction buttons.'
  },
  {
    name: 'disablePredictionManagement',
    label: 'Disable prediction management',
    description: 'Mods cannot run /prediction management subcommands.'
  },
  {
    name: 'disableRaffles',
    label: 'Disable raffle purchases',
    description: 'Users cannot buy raffle tickets.'
  },
  {
    name: 'disableRaffleManagement',
    label: 'Disable raffle management',
    description: 'Mods cannot manage raffles; scheduled draws are paused.'
  }
]

const OTHER_SWITCHES: SwitchRow[] = [
  {
    name: 'disableDailyBonus',
    label: 'Disable daily bonus',
    description: 'Block /bonus claim and check.'
  },
  {
    name: 'disableVip',
    label: 'Disable VIP',
    description: 'Block VIP purchase and room commands.'
  }
]

const SwitchGroup = ({
  title,
  icon: Icon,
  rows
}: {
  title: string
  icon: LucideIcon
  rows: SwitchRow[]
}) => {
  const form = useFormContext<TGlobalSettingsFormInput>()

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4" />
        {title}
      </h4>
      {rows.map((row) => (
        <FormField
          key={row.name}
          control={form.control}
          name={row.name}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border px-4 py-3">
              <div className="space-y-0.5 pr-4">
                <Label>{row.label}</Label>
                <p className="text-xs text-muted-foreground">
                  {row.description}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  )
}

const FeatureSwitchesCard = () => (
  <Card className="gap-4 py-4">
    <CardHeader className="pb-0">
      <CardTitle>Feature access</CardTitle>
      <CardDescription>
        Guild-wide kill switches applied before channel and game rules
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6 pt-0">
      <SwitchGroup title="ATM" icon={Landmark} rows={ATM_SWITCHES} />
      <SwitchGroup title="Casino" icon={Dices} rows={CASINO_SWITCHES} />
      <SwitchGroup title="Events" icon={TrendingUp} rows={EVENT_SWITCHES} />
      <SwitchGroup title="Other" icon={Gift} rows={OTHER_SWITCHES} />
    </CardContent>
  </Card>
)

export default FeatureSwitchesCard
