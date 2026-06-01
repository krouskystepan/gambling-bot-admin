'use client'

import { UseFormReturn } from 'react-hook-form'

import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

import GameHeader from './GameHeader'
import GameSection from './GameSection'

type Props = {
  game: keyof TCasinoSettingsValues
  form: UseFormReturn<TCasinoSettingsOutput>
}

const GameDetailPanel = ({ game, form }: Props) => (
  <div className="min-w-0 flex-1 rounded-lg border p-4">
    <GameHeader game={game} form={form} />
    <GameSection game={game} form={form} />
  </div>
)

export default GameDetailPanel
