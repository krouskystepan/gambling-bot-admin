'use client'

import {
  Card,
  CardContent
} from '@/components/ui/card'
import { TCasinoSettingsForm, TCasinoSettingsValues } from '@/types/types'

import GameHeader from './GameHeader'
import GameSection from './GameSection'

type Props = {
  game: keyof TCasinoSettingsValues
  form: TCasinoSettingsForm
}

const GameDetailPanel = ({ game, form }: Props) => (
  <Card className="min-w-0 flex-1 gap-0 overflow-hidden py-0">
    <div className="flex h-12 shrink-0 items-center border-b px-4">
      <GameHeader game={game} form={form} />
    </div>
    <CardContent className="p-4">
      <GameSection game={game} form={form} />
    </CardContent>
  </Card>
)

export default GameDetailPanel
