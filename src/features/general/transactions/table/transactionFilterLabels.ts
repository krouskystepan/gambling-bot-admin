import { formatCasinoGameLabel } from 'gambling-bot-shared'

import { LEGACY_CASINO_GAME_KEY } from '@/lib/transactions/transactionFilters'

export function getCasinoGameFilterLabel(gameId: string): string {
  if (gameId === LEGACY_CASINO_GAME_KEY) {
    return 'CASINO (UNKNOWN)'
  }
  return formatCasinoGameLabel(gameId)
}
