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
  symbolWeights: 'Weight',
  binMultipliers: 'Bin Payout'
}

/** Outcome-only labels (no "Pairs/21+3 Payout …" prefix). */
const SHORT_LABEL_RECORDS = new Set<RecordKey>([
  'pairsMultipliers',
  'plusThreeMultipliers'
])

const DISABLE_HINT = '0 = disabled.'

const BLACKJACK_RECORD_DESCRIPTIONS: Partial<
  Record<RecordKey, Record<string, string>>
> = {
  winMultipliers: {
    win: 'Main-bet win payout (total return).',
    blackjack: 'Natural blackjack payout (total return).',
    push: 'Push payout (total return; 1 returns stake).',
    insurance: `Insurance win payout (total return). ${DISABLE_HINT}`
  },
  pairsMultipliers: {
    perfect: `Perfect Pair payout (total return). ${DISABLE_HINT}`,
    colored: `Colored Pair payout (total return). ${DISABLE_HINT}`,
    mixed: `Mixed Pair payout (total return). ${DISABLE_HINT}`
  },
  plusThreeMultipliers: {
    suitedTrips: `Suited Trips payout (total return). ${DISABLE_HINT}`,
    straightFlush: `Straight Flush payout (total return). ${DISABLE_HINT}`,
    threeOfAKind: `Three of a Kind payout (total return). ${DISABLE_HINT}`,
    straight: `Straight payout (total return). ${DISABLE_HINT}`,
    flush: `Flush payout (total return). ${DISABLE_HINT}`
  }
}

/** Per-outcome help for people who do not know the side bet. */
const BLACKJACK_FIELD_HELP: Partial<Record<RecordKey, Record<string, string>>> =
  {
    pairsMultipliers: {
      perfect:
        "Pays when the player's first two cards are the same rank and same suit (identical cards; needs multiple decks).",
      colored:
        "Pays when the player's first two cards are the same rank and same color, but different suits (e.g. both red).",
      mixed:
        "Pays when the player's first two cards are the same rank but different colors (one red, one black)."
    },
    plusThreeMultipliers: {
      suitedTrips:
        "Pays when the player's first two cards and the dealer's up-card are three identical cards (same rank and suit). Needs at least 3 decks.",
      straightFlush:
        'Pays when those three cards are consecutive ranks and the same suit.',
      threeOfAKind:
        'Pays when those three cards are the same rank but not all the same suit.',
      straight:
        'Pays when those three cards are consecutive ranks but mixed suits.',
      flush:
        'Pays when those three cards are the same suit but not consecutive.'
    }
  }

const fieldDescription = (
  game: GameWithRecords,
  recordKey: RecordKey,
  key: string
): string | undefined => {
  if (game !== 'blackjack') return undefined
  return BLACKJACK_RECORD_DESCRIPTIONS[recordKey]?.[key]
}

const fieldHelp = (
  game: GameWithRecords,
  recordKey: RecordKey,
  key: string
): string | undefined => {
  if (game !== 'blackjack') return undefined
  return BLACKJACK_FIELD_HELP[recordKey]?.[key]
}

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
          description={fieldDescription(game, recordKey, key)}
          help={fieldHelp(game, recordKey, key)}
        />
      ))}
    </div>
  )
}
