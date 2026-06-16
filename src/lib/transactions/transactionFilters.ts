import type { CasinoGameId } from 'gambling-bot-shared/casino'

import { escapeRegExp } from '@/lib/utils'

export type TransactionFilter = Record<string, unknown>

export const LEGACY_CASINO_GAME_KEY = 'casino'

export function buildCasinoGameMetaFilter(
  filterCasinoGame: string[]
): TransactionFilter {
  const realGames = filterCasinoGame.filter(
    (game) => game !== LEGACY_CASINO_GAME_KEY
  )
  const includeLegacy = filterCasinoGame.includes(LEGACY_CASINO_GAME_KEY)

  if (realGames.length && includeLegacy) {
    return {
      $or: [
        { 'meta.game': { $in: realGames } },
        { 'meta.game': { $exists: false } },
        { 'meta.game': null }
      ]
    }
  }

  if (includeLegacy) {
    return {
      $or: [{ 'meta.game': { $exists: false } }, { 'meta.game': null }]
    }
  }

  return { 'meta.game': { $in: realGames as CasinoGameId[] } }
}

export function buildTransactionMatchFilters({
  userId,
  search,
  adminSearch,
  filterType,
  filterSource,
  filterCasinoGame
}: {
  userId?: string
  search?: string
  adminSearch?: string
  filterType?: string[]
  filterSource?: string[]
  filterCasinoGame?: string[]
}): TransactionFilter[] {
  const andFilters: TransactionFilter[] = []

  if (userId) {
    andFilters.push({ userId })
  } else if (search) {
    andFilters.push({ userId: new RegExp(escapeRegExp(search), 'i') })
  }

  if (adminSearch) {
    const regex = new RegExp(escapeRegExp(adminSearch), 'i')
    andFilters.push({
      $or: [{ handledBy: regex }, { betId: regex }, { 'meta.requestId': regex }]
    })
  }

  if (filterType?.length) {
    andFilters.push({ type: { $in: filterType } })
  }

  if (filterSource?.length) {
    if (filterCasinoGame?.length && filterSource.includes('casino')) {
      const nonCasinoSources = filterSource.filter(
        (source) => source !== 'casino'
      )
      const gameMetaFilter = buildCasinoGameMetaFilter(filterCasinoGame)

      if (nonCasinoSources.length === 0) {
        andFilters.push({ source: 'casino', ...gameMetaFilter })
      } else {
        andFilters.push({
          $or: [
            { source: { $in: nonCasinoSources } },
            { source: 'casino', ...gameMetaFilter }
          ]
        })
      }
    } else {
      andFilters.push({ source: { $in: filterSource } })
    }
  } else if (filterCasinoGame?.length) {
    andFilters.push({
      source: 'casino',
      ...buildCasinoGameMetaFilter(filterCasinoGame)
    })
  }

  return andFilters
}

export function buildTransactionQuery(
  guildId: string,
  filters: TransactionFilter[]
): TransactionFilter {
  return filters.length > 0 ? { guildId, $and: filters } : { guildId }
}
