import type { GameWithRecords, RecordKey } from 'gambling-bot-shared/casino'

import type { TCasinoSettingsValues } from '@/types/types'

const DISABLE_HINT = '0 = disabled.'
const NO_MIN = '0 = no minimum.'
const NO_MAX = '0 = no maximum.'
const TOTAL_RETURN = 'total return'

const TOTAL_RETURN_HELP =
  'Total return includes the original stake (2 = even money / 1:1). Set to 0 to disable that outcome or bet type.'

const HOUSE_EDGE_HELP =
  'Enter percent points, not a fraction (3 = 3%, not 0.03). Higher edge lowers player RTP.'

const BET_MIN_HELP =
  'Lowest stake allowed for the main bet. Use compact amounts like 2k or 4.5M. 0 removes the minimum.'

const BET_MAX_HELP =
  'Highest stake allowed for the main bet. Use compact amounts like 2k or 4.5M. 0 removes the maximum.'

/** Shared bet-limit copy used across games. */
const BET_LIMIT_DESCRIPTIONS: Record<string, string> = {
  minBet: `Lowest main bet allowed for this game. ${NO_MIN}`,
  maxBet: `Highest main bet allowed for this game. ${NO_MAX}`
}

const HOUSE_EDGE_DESCRIPTION = 'House edge in percent (e.g. 3 = 3%).'

/** Per-game numeric field descriptions (top-level number keys only). */
const NUMERIC_DESCRIPTIONS: Partial<
  Record<keyof TCasinoSettingsValues, Record<string, string>>
> = {
  dice: {
    ...BET_LIMIT_DESCRIPTIONS,
    winMultiplier: `Win payout (${TOTAL_RETURN}).`
  },
  coinflip: {
    ...BET_LIMIT_DESCRIPTIONS,
    winMultiplier: `Win payout (${TOTAL_RETURN}).`
  },
  hilo: {
    ...BET_LIMIT_DESCRIPTIONS,
    houseEdge: HOUSE_EDGE_DESCRIPTION
  },
  limbo: {
    ...BET_LIMIT_DESCRIPTIONS,
    houseEdge: HOUSE_EDGE_DESCRIPTION
  },
  slots: BET_LIMIT_DESCRIPTIONS,
  lottery: BET_LIMIT_DESCRIPTIONS,
  roulette: BET_LIMIT_DESCRIPTIONS,
  baccarat: BET_LIMIT_DESCRIPTIONS,
  rps: {
    ...BET_LIMIT_DESCRIPTIONS,
    houseEdge: 'House edge in percent (e.g. 2.5 = 2.5%).'
  },
  goldenJackpot: {
    ...BET_LIMIT_DESCRIPTIONS,
    winMultiplier: `Jackpot payout (${TOTAL_RETURN}).`,
    oneInChance: 'Odds denominator (e.g. 12000 = 1 in 12,000).'
  },
  blackjack: {
    ...BET_LIMIT_DESCRIPTIONS,
    deckCount: 'Number of decks in the shoe used for dealing. Clamped to 2-8.'
  },
  mines: {
    ...BET_LIMIT_DESCRIPTIONS,
    houseEdge: HOUSE_EDGE_DESCRIPTION,
    minMines: 'Lowest mine count players can choose.',
    maxMines: 'Highest mine count players can choose.'
  },
  prediction: BET_LIMIT_DESCRIPTIONS,
  raffle: {
    houseEdge: 'House edge in percent (e.g. 1 = 1%).'
  },
  plinko: BET_LIMIT_DESCRIPTIONS,
  winAnnouncements: {
    plinkoMinMultiplier: `Minimum win multiplier to announce Plinko. ${DISABLE_HINT}`,
    goldenJackpotMinMultiplier: `Minimum win multiplier to announce Golden Jackpot. ${DISABLE_HINT}`,
    slotsMinMultiplier: `Minimum win multiplier to announce Slots. ${DISABLE_HINT}`,
    lotteryMinMultiplier: `Minimum win multiplier to announce Lottery. ${DISABLE_HINT}`,
    rouletteMinMultiplier: `Minimum win multiplier to announce Roulette. ${DISABLE_HINT}`,
    baccaratMinMultiplier: `Minimum win multiplier to announce Baccarat. ${DISABLE_HINT}`,
    blackjackMinMultiplier: `Minimum win multiplier to announce Blackjack. ${DISABLE_HINT}`,
    minesMinMultiplier: `Minimum win multiplier to announce Mines. ${DISABLE_HINT}`,
    diceMinMultiplier: `Minimum win multiplier to announce Dice. ${DISABLE_HINT}`,
    coinflipMinMultiplier: `Minimum win multiplier to announce Coin Flip. ${DISABLE_HINT}`,
    hiloMinMultiplier: `Minimum win multiplier to announce Hi-Lo. ${DISABLE_HINT}`,
    limboMinMultiplier: `Minimum win multiplier to announce Limbo. ${DISABLE_HINT}`
  }
}

/** Shared help for common numeric keys; game-specific help can override. */
const NUMERIC_HELP_BY_KEY: Record<string, string> = {
  minBet: BET_MIN_HELP,
  maxBet: BET_MAX_HELP,
  houseEdge: HOUSE_EDGE_HELP,
  winMultiplier: TOTAL_RETURN_HELP,
  oneInChance:
    'Chance is 1 in this number each eligible bet (12000 ≈ 0.0083%). Higher = rarer jackpot.',
  deckCount:
    'More decks slightly change card odds and side-bet hit rates. Allowed range is 2-8.',
  minMines: 'Players cannot pick fewer mines than this when starting a round.',
  maxMines: 'Players cannot pick more mines than this when starting a round.'
}

const WIN_ANNOUNCEMENT_HELP =
  'When a win multiplier is at least this value, post an announcement to the configured channel. 0 disables announcements for that game.'

export const numericFieldDescription = (
  game: keyof TCasinoSettingsValues,
  key: string
): string | undefined => NUMERIC_DESCRIPTIONS[game]?.[key]

export const numericFieldHelp = (
  game: keyof TCasinoSettingsValues,
  key: string
): string | undefined => {
  if (game === 'winAnnouncements') return WIN_ANNOUNCEMENT_HELP
  return NUMERIC_HELP_BY_KEY[key]
}

/** Short under-input copy: what the value edits. */
const RECORD_DESCRIPTIONS: Partial<
  Record<GameWithRecords, Partial<Record<RecordKey, Record<string, string>>>>
> = {
  blackjack: {
    winMultipliers: {
      win: `Main-bet win payout (${TOTAL_RETURN}).`,
      blackjack: `Natural blackjack payout (${TOTAL_RETURN}).`,
      push: `Push payout (${TOTAL_RETURN}; 1 returns stake).`,
      insurance: `Insurance win payout (${TOTAL_RETURN}). ${DISABLE_HINT}`
    },
    pairsMultipliers: {
      perfect: `Perfect Pair payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      colored: `Colored Pair payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      mixed: `Mixed Pair payout (${TOTAL_RETURN}). ${DISABLE_HINT}`
    },
    plusThreeMultipliers: {
      suitedTrips: `Suited Trips payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      straightFlush: `Straight Flush payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      threeOfAKind: `Three of a Kind payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      straight: `Straight payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      flush: `Flush payout (${TOTAL_RETURN}). ${DISABLE_HINT}`
    }
  },
  baccarat: {
    winMultipliers: {
      player: `Player win payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      banker: `Banker win payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      tie: `Tie payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      playerPair: `Player Pair payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      bankerPair: `Banker Pair payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      eitherPair: `Either Pair payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      perfectPair: `Perfect Pair payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      big: `Big payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      small: `Small payout (${TOTAL_RETURN}). ${DISABLE_HINT}`
    },
    dragonBonusMultipliers: {
      winBy9: `Dragon Bonus win-by-9 payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      winBy8: `Dragon Bonus win-by-8 payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      winBy7: `Dragon Bonus win-by-7 payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      winBy6: `Dragon Bonus win-by-6 payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      winBy5: `Dragon Bonus win-by-5 payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      winBy4: `Dragon Bonus win-by-4 payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      naturalWin: `Dragon Bonus natural-win payout (${TOTAL_RETURN}). ${DISABLE_HINT}`
    },
    lucky6Multipliers: {
      twoCard: `Lucky 6 two-card payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      threeCard: `Lucky 6 three-card payout (${TOTAL_RETURN}). ${DISABLE_HINT}`
    }
  },
  roulette: {
    winMultipliers: {
      number: `Single-number payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      color: `Red/black payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      parity: `Even/odd payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      range: `Low/high (1-18 / 19-36) payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      dozen: `Dozen payout (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      column: `Column payout (${TOTAL_RETURN}). ${DISABLE_HINT}`
    }
  },
  lottery: {
    winMultipliers: {
      '4': `Payout for 4 matches (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      '3': `Payout for 3 matches (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      '2': `Payout for 2 matches (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      '1': `Payout for 1 match (${TOTAL_RETURN}). ${DISABLE_HINT}`,
      '0': `Payout for 0 matches (${TOTAL_RETURN}). ${DISABLE_HINT}`
    }
  }
  // slots / plinko use recordFallbackDescription (dynamic symbol / bin keys).
}

/** Fallback for record keys without a dedicated line (e.g. slots symbols). */
const recordFallbackDescription = (
  recordKey: RecordKey,
  key: string
): string | undefined => {
  if (recordKey === 'winMultipliers') {
    return `Payout for ${key} (${TOTAL_RETURN}). ${DISABLE_HINT}`
  }
  if (recordKey === 'symbolWeights') {
    return `Relative draw weight for ${key}. Higher = more common.`
  }
  if (recordKey === 'binMultipliers') {
    return `Payout for this bin (${TOTAL_RETURN}).`
  }
  if (recordKey === 'dragonBonusMultipliers') {
    return `Dragon Bonus tier payout (${TOTAL_RETURN}). ${DISABLE_HINT}`
  }
  if (recordKey === 'lucky6Multipliers') {
    return `Lucky 6 tier payout (${TOTAL_RETURN}). ${DISABLE_HINT}`
  }
  return undefined
}

export const recordFieldDescription = (
  game: GameWithRecords,
  recordKey: RecordKey,
  key: string
): string | undefined =>
  RECORD_DESCRIPTIONS[game]?.[recordKey]?.[key] ??
  recordFallbackDescription(recordKey, key)

/** Tooltip help for people who may not know the bet / value meaning. */
const RECORD_HELP: Partial<
  Record<GameWithRecords, Partial<Record<RecordKey, Record<string, string>>>>
> = {
  blackjack: {
    winMultipliers: {
      win: `${TOTAL_RETURN_HELP} Used when the player beats the dealer without a natural blackjack.`,
      blackjack:
        'Pays on a natural blackjack (Ace + 10-value on the first two cards). Common casino value is 2.5 (3:2).',
      push: 'Paid when the hand ties the dealer. 1 returns the stake; other values change push behavior.',
      insurance:
        'Optional side bet when the dealer shows an Ace. Pays if the dealer has blackjack. Common value is 3 (2:1). 0 disables insurance.'
    },
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
  },
  baccarat: {
    winMultipliers: {
      player: 'Pays when the Player hand wins (higher total than Banker).',
      banker: 'Pays when the Banker hand wins (higher total than Player).',
      tie: 'Pays when Player and Banker totals are equal.',
      playerPair: "Pays when Player's first two cards are the same rank.",
      bankerPair: "Pays when Banker's first two cards are the same rank.",
      eitherPair:
        "Pays when Player's or Banker's first two cards are the same rank.",
      perfectPair:
        "Pays when Player's or Banker's first two cards match rank and suit.",
      big: 'Pays when the round uses 5 or 6 cards total.',
      small: 'Pays when the round uses exactly 4 cards total.'
    },
    dragonBonusMultipliers: {
      winBy9:
        'Pays when the chosen side wins by exactly 9 points (non-natural).',
      winBy8:
        'Pays when the chosen side wins by exactly 8 points (non-natural).',
      winBy7:
        'Pays when the chosen side wins by exactly 7 points (non-natural).',
      winBy6:
        'Pays when the chosen side wins by exactly 6 points (non-natural).',
      winBy5:
        'Pays when the chosen side wins by exactly 5 points (non-natural).',
      winBy4:
        'Pays when the chosen side wins by exactly 4 points (non-natural).',
      naturalWin:
        'Pays when the chosen side wins with a natural 8 or 9 (two-card hand).'
    },
    lucky6Multipliers: {
      twoCard:
        'Pays when Banker wins with a total of 6 using exactly two cards.',
      threeCard:
        'Pays when Banker wins with a total of 6 using exactly three cards.'
    }
  },
  roulette: {
    winMultipliers: {
      number: 'Pays on a straight-up bet on a single pocket.',
      color: 'Pays on red or black.',
      parity: 'Pays on even or odd.',
      range: 'Pays on 1-18 (low) or 19-36 (high).',
      dozen: 'Pays on 1st / 2nd / 3rd dozen.',
      column: 'Pays on one of the three columns.'
    }
  },
  lottery: {
    winMultipliers: {
      '4': `${TOTAL_RETURN_HELP} Paid when all 4 numbers match.`,
      '3': `${TOTAL_RETURN_HELP} Paid when exactly 3 numbers match.`,
      '2': `${TOTAL_RETURN_HELP} Paid when exactly 2 numbers match.`,
      '1': `${TOTAL_RETURN_HELP} Paid when exactly 1 number matches.`,
      '0': `${TOTAL_RETURN_HELP} Paid when no numbers match (usually 0).`
    }
  }
}

const recordFallbackHelp = (
  recordKey: RecordKey,
  key: string
): string | undefined => {
  if (recordKey === 'winMultipliers') {
    return `${TOTAL_RETURN_HELP} Outcome: ${key}.`
  }
  if (recordKey === 'symbolWeights') {
    return `Higher weight = ${key} appears more often on the reels. Relative to other symbol weights, not a percent.`
  }
  if (recordKey === 'binMultipliers') {
    return `${TOTAL_RETURN_HELP} Edge bins are mirrored automatically.`
  }
  if (
    recordKey === 'pairsMultipliers' ||
    recordKey === 'plusThreeMultipliers' ||
    recordKey === 'dragonBonusMultipliers' ||
    recordKey === 'lucky6Multipliers'
  ) {
    return TOTAL_RETURN_HELP
  }
  return undefined
}

export const recordFieldHelp = (
  game: GameWithRecords,
  recordKey: RecordKey,
  key: string
): string | undefined =>
  RECORD_HELP[game]?.[recordKey]?.[key] ?? recordFallbackHelp(recordKey, key)

export const PLINKO_BIN_DESCRIPTION = `Payout for this bin (${TOTAL_RETURN}). Mirrored bins stay in sync.`

export const PLINKO_BIN_HELP = `${TOTAL_RETURN_HELP} Editing bin 1-4 also updates its mirrored pair (9-6).`
