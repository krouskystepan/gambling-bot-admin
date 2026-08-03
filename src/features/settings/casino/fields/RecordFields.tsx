'use client'

import {
  defaultCasinoSettings,
  readableGameValueNames
} from 'gambling-bot-shared/casino'
import {
  GAME_RECORD_FIELDS,
  type GameWithRecords,
  type RecordKey
} from 'gambling-bot-shared/casino'
import { getReadableName } from 'gambling-bot-shared/common'
import { Path } from 'react-hook-form'

import { TCasinoSettingsForm, TCasinoSettingsInput } from '@/types/types'

import { recordFieldDescription, recordFieldHelp } from '../fieldDescriptions'
import { NumberField } from './NumberField'

type Props<G extends GameWithRecords> = {
  game: G
  recordKey: (typeof GAME_RECORD_FIELDS)[G][number]
  values: Record<string, number>
  form: TCasinoSettingsForm
}

const LABELS: Record<RecordKey, string> = {
  winMultipliers: 'Payout',
  pairsMultipliers: 'Pairs Payout',
  plusThreeMultipliers: '21+3 Payout',
  dragonBonusMultipliers: 'Dragon Bonus',
  lucky6Multipliers: 'Lucky 6',
  symbolWeights: 'Weight',
  binMultipliers: 'Bin Payout'
}

/** Outcome-only labels (no group prefix). */
const SHORT_LABEL_RECORDS = new Set<RecordKey>([
  'pairsMultipliers',
  'plusThreeMultipliers',
  'dragonBonusMultipliers',
  'lucky6Multipliers'
])

const fieldLabel = (recordKey: RecordKey, key: string): string => {
  const readable = getReadableName(key, readableGameValueNames)
  if (SHORT_LABEL_RECORDS.has(recordKey)) return readable
  return `${LABELS[recordKey]} ${readable}`
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
    <div className="mt-3 grid grid-cols-6 items-start gap-3">
      {Object.keys(values).map((key) => (
        <NumberField
          key={key}
          form={form}
          name={`${game}.${recordKey}.${key}` as Path<TCasinoSettingsInput>}
          label={fieldLabel(recordKey, key)}
          defaultValue={defaultRecord?.[key]}
          description={recordFieldDescription(game, recordKey, key)}
          help={recordFieldHelp(game, recordKey, key)}
        />
      ))}
    </div>
  )
}
