import type { CasinoGameId } from 'gambling-bot-shared/casino'
import type { TTransaction } from 'gambling-bot-shared/transactions'

import type { ITransactionCounts, TTransactionDiscord } from '@/types/types'

import {
  DEMO_MEMBERS,
  DEMO_STAFF_MEMBERS,
  getDemoAvatar,
  getDemoNickname,
  getDemoUsername
} from './demoGuild'
import { createDemoRng, pick, randInt } from './demoRng'

const CASINO_GAMES = [
  'dice',
  'coinflip',
  'hilo',
  'limbo',
  'slots',
  'roulette',
  'baccarat',
  'blackjack',
  'mines',
  'plinko',
  'lottery',
  'rps'
] as const satisfies readonly CasinoGameId[]

type DemoGame = (typeof CASINO_GAMES)[number]

/**
 * Per-game payout model. `winProb * mult < 1` for every game, so the house keeps
 * a small positive edge over time (a realistic casino that is "in the +"), while
 * individual rounds and days still swing both ways. `weight` controls how often
 * a game is played — low-variance games dominate so the cumulative house PnL
 * trends smoothly upward.
 */
type GameModel = { winProb: number; mult: number; weight: number }

const GAME_MODELS: Record<DemoGame, GameModel> = {
  dice: { winProb: 0.49, mult: 2.0, weight: 20 },
  coinflip: { winProb: 0.48, mult: 2.0, weight: 18 },
  hilo: { winProb: 0.46, mult: 1.94, weight: 12 },
  limbo: { winProb: 0.485, mult: 2.0, weight: 11 },
  blackjack: { winProb: 0.47, mult: 2.05, weight: 16 },
  mines: { winProb: 0.44, mult: 2.15, weight: 10 },
  roulette: { winProb: 0.47, mult: 2.0, weight: 14 },
  baccarat: { winProb: 0.446, mult: 2.0, weight: 12 },
  plinko: { winProb: 0.45, mult: 2.1, weight: 10 },
  rps: { winProb: 0.46, mult: 2.0, weight: 9 },
  slots: { winProb: 0.3, mult: 3.2, weight: 8 },
  lottery: { winProb: 0.12, mult: 7.5, weight: 5 }
}

const WEIGHTED_GAMES: DemoGame[] = CASINO_GAMES.flatMap((game) =>
  Array.from({ length: GAME_MODELS[game].weight }, () => game)
)

type DemoRawTx = {
  id: string
  userId: string
  type: TTransaction['type']
  source: TTransaction['source']
  amount: number
  game?: CasinoGameId
  handledBy?: string
  referenceId?: string
  createdAt: Date
}

const SPAN_DAYS = 180
const DAY_MS = 24 * 60 * 60 * 1000

/** Standard normal sample (Box–Muller) from the deterministic PRNG. */
function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-9)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const round25 = (value: number): number =>
  Math.max(25, Math.round(value / 25) * 25)

/**
 * Build the demo ledger one calendar day at a time.
 *
 * A real casino grinds *upward* because its edge is applied over huge volume —
 * a small per-round edge with only a few hundred rounds is pure noise and
 * happily wanders deep negative for months. So instead of hoping randomness
 * nets out, we fix a target house edge for each day (mostly positive, with the
 * occasional shallow losing day) and scale that day's payouts to hit it. The
 * per-game multipliers still shape individual wins, so transactions look real
 * while the cumulative "house P&L" line climbs steadily.
 */
function buildRawTransactions(): DemoRawTx[] {
  const rng = createDemoRng(0x5eed01)
  const now = Date.now()
  const players = DEMO_MEMBERS
  const staff = DEMO_STAFF_MEMBERS

  const rows: DemoRawTx[] = []
  let n = 0
  const nextId = () => `demo-tx-${n++}`

  // Luck carries over between days (an AR(1) process), so the house goes on hot
  // and cold runs instead of a robotic straight line. It starts slightly hot so
  // the book banks a profit cushion early and never lingers in the red.
  let luck = 0.07

  for (let day = SPAN_DAYS - 1; day >= 0; day--) {
    const dayStart = now - day * DAY_MS
    const dayIndex = SPAN_DAYS - 1 - day
    const timestamp = () => new Date(dayStart - randInt(rng, 0, 86_000) * 1000)

    // Volume ramps up gently over the life of the casino (it grows popular).
    const growth = 0.6 + (0.8 * dayIndex) / SPAN_DAYS
    const rounds = Math.max(4, Math.round(randInt(rng, 6, 20) * growth))

    type Round = {
      game: DemoGame
      userId: string
      wager: number
      isWin: boolean
    }

    const roundData: Round[] = []
    let dayWager = 0
    for (let r = 0; r < rounds; r++) {
      const game = pick(rng, WEIGHTED_GAMES)
      const wager = randInt(rng, 1, 20) * 25
      dayWager += wager
      roundData.push({
        game,
        userId: pick(rng, players).userId,
        wager,
        isWin: rng() < 0.46
      })
    }

    // Target house edge for the day. Base edge ~6%, modulated by the running
    // luck streak, with the occasional "jackpot day" where a whale hits big and
    // the house pays out (a sharp red day). Volume still outweighs it over time,
    // so the cumulative line climbs with realistic pullbacks instead of a ruler.
    luck = 0.78 * luck + gaussian(rng) * 0.045
    let edge = 0.062 + luck
    if (rng() < 0.045) edge -= 0.18 + rng() * 0.18
    edge = Math.min(0.24, Math.max(-0.7, edge))
    const targetPayout = dayWager * (1 - edge)

    let baseWins = 0
    for (const rd of roundData) {
      if (rd.isWin) baseWins += rd.wager * GAME_MODELS[rd.game].mult
    }
    if (baseWins === 0 && roundData.length > 0) {
      roundData[0].isWin = true
      baseWins = roundData[0].wager * GAME_MODELS[roundData[0].game].mult
    }
    // Scale keeps total payouts ≈ targetPayout, so the day nets ≈ dayWager*edge.
    const scale = baseWins > 0 ? targetPayout / baseWins : 0

    roundData.forEach((rd, r) => {
      const createdAt = timestamp()
      const referenceId = `bet-${dayIndex}-${r}`

      rows.push({
        id: nextId(),
        userId: rd.userId,
        type: 'bet',
        source: 'casino',
        amount: rd.wager,
        game: rd.game,
        referenceId,
        createdAt
      })

      if (rd.isWin) {
        const payout = round25(rd.wager * GAME_MODELS[rd.game].mult * scale)
        rows.push({
          id: nextId(),
          userId: rd.userId,
          type: 'win',
          source: 'casino',
          amount: payout,
          game: rd.game,
          referenceId,
          createdAt: new Date(createdAt.getTime() + randInt(rng, 1, 40) * 1000)
        })
      }
    })

    // A handful of banking / reward events per day. Deposits outnumber
    // withdrawals so the economy keeps growing.
    const bankCount = randInt(rng, 0, 3)
    for (let b = 0; b < bankCount; b++) {
      const userId = pick(rng, players).userId
      const createdAt = timestamp()
      const roll = rng()

      if (roll < 0.44) {
        rows.push({
          id: nextId(),
          userId,
          type: 'deposit',
          source: 'manual',
          amount: randInt(rng, 2, 40) * 100,
          handledBy: pick(rng, staff).userId,
          referenceId: `atm-${dayIndex}-${b}`,
          createdAt
        })
      } else if (roll < 0.66) {
        rows.push({
          id: nextId(),
          userId,
          type: 'withdraw',
          source: 'manual',
          amount: randInt(rng, 2, 22) * 100,
          handledBy: pick(rng, staff).userId,
          referenceId: `atm-${dayIndex}-${b}`,
          createdAt
        })
      } else if (roll < 0.86) {
        rows.push({
          id: nextId(),
          userId,
          type: 'bonus',
          source: 'system',
          amount: randInt(rng, 1, 4) * 50,
          createdAt
        })
      } else if (roll < 0.95) {
        rows.push({
          id: nextId(),
          userId,
          type: 'vip',
          source: 'system',
          amount: randInt(rng, 5, 20) * 100,
          referenceId: `vip-${dayIndex}-${b}`,
          createdAt
        })
      } else {
        rows.push({
          id: nextId(),
          userId,
          type: 'refund',
          source: 'command',
          amount: randInt(rng, 1, 10) * 25,
          referenceId: `ref-${dayIndex}-${b}`,
          createdAt
        })
      }
    }
  }

  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

let cachedRaw: DemoRawTx[] | null = null

function getRawTransactions(): DemoRawTx[] {
  cachedRaw ??= buildRawTransactions()
  return cachedRaw
}

function toDiscordTx(row: DemoRawTx): TTransactionDiscord {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    amount: row.amount,
    source: row.source,
    createdAt: row.createdAt,
    referenceId: row.referenceId,
    handledBy: row.handledBy,
    handledByUsername: row.handledBy ? getDemoUsername(row.handledBy) : null,
    meta: row.game ? { game: row.game } : undefined,
    username: getDemoUsername(row.userId),
    nickname: getDemoNickname(row.userId),
    avatar: getDemoAvatar(row.userId)
  }
}

export type DemoTransactionsQuery = {
  page?: number
  limit?: number
  search?: string
  staffId?: string
  referenceId?: string
  filterType?: string[]
  filterSource?: string[]
  filterCasinoGame?: string[]
  dateFrom?: string
  dateTo?: string
  sort?: string
  userId?: string
}

function inDateRange(
  row: DemoRawTx,
  dateFrom?: string,
  dateTo?: string
): boolean {
  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`)
    if (row.createdAt < from) return false
  }
  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`)
    if (row.createdAt > to) return false
  }
  return true
}

function matchesFilters(row: DemoRawTx, query: DemoTransactionsQuery): boolean {
  if (query.userId && row.userId !== query.userId) return false
  if (query.search && !row.userId.includes(query.search)) return false
  if (query.staffId && row.handledBy !== query.staffId) return false
  if (query.referenceId && !row.referenceId?.includes(query.referenceId)) {
    return false
  }
  if (query.filterType?.length && !query.filterType.includes(row.type)) {
    return false
  }
  if (query.filterSource?.length && !query.filterSource.includes(row.source)) {
    return false
  }
  if (
    query.filterCasinoGame?.length &&
    (!row.game || !query.filterCasinoGame.includes(row.game))
  ) {
    return false
  }
  return inDateRange(row, query.dateFrom, query.dateTo)
}

function applySort(rows: DemoRawTx[], sort?: string): DemoRawTx[] {
  if (!sort) {
    return [...rows].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
  }

  const clauses = sort
    .split(',')
    .map((clause) => clause.split(':'))
    .filter(([field]) => field)

  return [...rows].sort((a, b) => {
    for (const [field, dir] of clauses) {
      const factor = dir === 'asc' ? 1 : -1
      let diff = 0
      switch (field) {
        case 'amount':
          diff = a.amount - b.amount
          break
        case 'type':
          diff = a.type.localeCompare(b.type)
          break
        case 'source':
          diff = a.source.localeCompare(b.source)
          break
        case 'createdAt':
        default:
          diff = a.createdAt.getTime() - b.createdAt.getTime()
          break
      }
      if (diff !== 0) return diff * factor
    }
    return 0
  })
}

function computeTotals(rows: DemoRawTx[]): {
  gamePnL: number
  cashFlow: number
} {
  let gamePnL = 0
  let cashFlow = 0
  for (const row of rows) {
    if (row.type === 'bet' || row.type === 'vip') gamePnL += row.amount
    if (row.type === 'win' || row.type === 'bonus' || row.type === 'refund') {
      gamePnL -= row.amount
    }
    if (row.type === 'deposit') cashFlow += row.amount
    if (row.type === 'withdraw') cashFlow -= row.amount
  }
  return { gamePnL, cashFlow }
}

export function getDemoTransactions(query: DemoTransactionsQuery): {
  transactions: TTransactionDiscord[]
  total: number
  gamePnL: number
  cashFlow: number
} {
  const filtered = getRawTransactions().filter((row) =>
    matchesFilters(row, query)
  )
  const sorted = applySort(filtered, query.sort)
  const page = query.page && query.page > 0 ? query.page : 1
  const limit = query.limit && query.limit > 0 ? query.limit : 10
  const start = (page - 1) * limit
  const pageRows = sorted.slice(start, start + limit)
  const { gamePnL, cashFlow } = computeTotals(filtered)

  return {
    transactions: pageRows.map(toDiscordTx),
    total: filtered.length,
    gamePnL,
    cashFlow
  }
}

export function getDemoRecentTransactions(
  limit: number
): TTransactionDiscord[] {
  return getRawTransactions().slice(0, limit).map(toDiscordTx)
}

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1
}

export function getDemoTransactionCounts(
  query: DemoTransactionsQuery
): ITransactionCounts {
  // Counts ignore the facet they represent so the filter UI can show totals.
  const base = getRawTransactions().filter((row) =>
    inDateRange(row, query.dateFrom, query.dateTo)
  )

  const type = {} as ITransactionCounts['type']
  const source = {} as ITransactionCounts['source']
  const casinoGame: Record<string, number> = {}
  const staff: Record<string, number> = {}
  const users: Record<string, number> = {}

  for (const row of base) {
    increment(type as Record<string, number>, row.type)
    increment(source as Record<string, number>, row.source)
    if (row.game) increment(casinoGame, row.game)
    if (row.handledBy) increment(staff, row.handledBy)
    increment(users, row.userId)
  }

  return { type, source, casinoGame, staff, users }
}

/** Raw rows for aggregation by other fixtures (overview, reports). */
export function getDemoRawTransactions(): DemoRawTx[] {
  return getRawTransactions()
}

export type { DemoRawTx }
