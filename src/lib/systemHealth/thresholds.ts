import { DAY_MS, MINUTE_MS } from 'gambling-bot-shared/common'

/** Matches blackjack autostand worker (`getAllOldBlackjackGames(1)`). */
export const blackjackStaleCutoff = () => new Date(Date.now() - DAY_MS)

/** Ops heuristic: paying predictions with no update for 10+ minutes. */
export const predictionStuckPayingCutoff = () =>
  new Date(Date.now() - 10 * MINUTE_MS)

/** Ops heuristic: ATM requests pending for 24+ hours. */
export const atmStalePendingCutoff = () => new Date(Date.now() - DAY_MS)
