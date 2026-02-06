'use client'

import { defaultCasinoSettings } from 'gambling-bot-shared'
import { Path, UseFormReturn } from 'react-hook-form'

import { TCasinoSettingsValues } from '@/types/types'

import { GameWithRecords, RecordKey } from '../config'
import { NumberField } from './NumberField'

type Props<G extends GameWithRecords> = {
  game: G
  recordKey: (typeof import('../config').GAME_RECORD_FIELDS)[G][number]
  values: Record<string, number>
  form: UseFormReturn<TCasinoSettingsValues>
}

const LABELS: Record<RecordKey, string> = {
  winMultipliers: 'Payout',
  symbolWeights: 'Weight',
  binMultipliers: 'Bin Payout'
}

export function RecordFields<G extends GameWithRecords>({
  game,
  recordKey,
  values,
  form
}: Props<G>) {
  const gameDefaults = defaultCasinoSettings[game] as Extract<
    (typeof defaultCasinoSettings)[GameWithRecords],
    Record<RecordKey, Record<string, number>>
  >

  const defaultRecord = gameDefaults[recordKey]

  return (
    <div
      className="grid gap-3 mt-3"
      style={{
        gridTemplateColumns: `repeat(${Object.keys(values).length}, minmax(0,1fr))`
      }}
    >
      {Object.keys(values).map((key) => (
        <NumberField
          key={key}
          form={form}
          name={`${game}.${recordKey}.${key}` as Path<TCasinoSettingsValues>}
          label={`${LABELS[recordKey]} ${key}`}
          defaultValue={defaultRecord?.[key]}
        />
      ))}
    </div>
  )
}
