import {
  TCasinoSettings,
  calculateRTP,
  readableGameNames
} from 'gambling-bot-shared'
import { getServerSession } from 'next-auth'

import { getCasinoSettings } from '@/actions/database/casinoSettings.action'
import { authOptions } from '@/lib/authOptions'
import { getReadableName } from '@/lib/utils'

const RTPBadge = ({ value }: { value: number }) => {
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-lg text-neutral-400`}
    >
      RTP {value.toFixed(2)}%
    </span>
  )
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">
    {children}
  </div>
)

const GameCard = ({
  gameKey,
  gameSettings,
  isAdmin
}: {
  gameKey: keyof TCasinoSettings
  gameSettings: TCasinoSettings[keyof TCasinoSettings]
  isAdmin: boolean
}) => {
  const rawName = getReadableName(gameKey, readableGameNames)
  const readableName = rawName === 'Rock Paper Scissors' ? 'RPS' : rawName
  const rtp = calculateRTP(gameKey, gameSettings)

  return (
    <div className="bg-linear-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-lg hover:border-amber-400/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{readableName}</h2>
        {isAdmin && typeof rtp === 'number' && <RTPBadge value={rtp} />}
      </div>

      <div className="h-px bg-neutral-800 mb-4" />

      <div className="space-y-2 text-sm">
        {'minBet' in gameSettings && (
          <div className="flex justify-between text-neutral-400">
            <span>Min Bet</span>
            <span className="text-neutral-200">
              {Number(gameSettings.minBet).toLocaleString()}
            </span>
          </div>
        )}

        {'maxBet' in gameSettings && (
          <div className="flex justify-between text-neutral-400">
            <span>Max Bet</span>
            <span className="text-neutral-200">
              {Number(gameSettings.maxBet).toLocaleString()}
            </span>
          </div>
        )}

        {'casinoCut' in gameSettings && (
          <div className="flex justify-between text-neutral-400">
            <span>Casino Cut</span>
            <span className="text-neutral-200">
              {(Number(gameSettings.casinoCut) * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {'binMultipliers' in gameSettings && (
        <div className="mt-5">
          <SectionTitle>Plinko Bins</SectionTitle>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(gameSettings.binMultipliers).map(([bin, mult]) => (
              <span
                key={bin}
                className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300"
              >
                {bin}: x{Number(mult).toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}

      {'winMultipliers' in gameSettings && (
        <div className="mt-5">
          <SectionTitle>Payout Table</SectionTitle>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(gameSettings.winMultipliers).map(
              ([symbol, mult]) => (
                <span
                  key={symbol}
                  className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300"
                >
                  {symbol}: x{Number(mult).toFixed(2)}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {'symbolWeights' in gameSettings && (
        <div className="mt-5">
          <SectionTitle>Symbol Weights</SectionTitle>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(gameSettings.symbolWeights).map(
              ([symbol, weight]) => (
                <span
                  key={symbol}
                  className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300"
                >
                  {symbol}: {Number(weight)}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {isAdmin && typeof rtp !== 'number' && (
        <div className="mt-5">
          <SectionTitle>RTP Breakdown</SectionTitle>
          <div className="space-y-1 text-sm">
            {Object.entries(rtp).map(([betType, value]) => (
              <div
                key={betType}
                className="flex justify-between text-neutral-300"
              >
                <span className="capitalize">{betType}</span>
                <span className="text-amber-400 font-medium">
                  {value.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const GuildStats = async ({
  params
}: {
  params: Promise<{ guildId: string }>
}) => {
  const { guildId } = await params
  await getServerSession(authOptions)

  const isAdmin = true
  if (isAdmin) return

  const settings = await getCasinoSettings(guildId)
  if (!settings) return <div>No casino settings found.</div>

  const otherGames = ['roulette', 'slots', 'plinko', 'lottery']

  return (
    <div className="p-10 max-w-425 mx-auto space-y-10">
      <h1 className="text-2xl font-bold tracking-wide">Casino Overview</h1>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(settings)
          .filter(([key]) =>
            ['roulette', 'slots', 'plinko', 'lottery'].includes(key)
          )
          .map(([key, value]) => (
            <GameCard
              key={key}
              gameKey={key as keyof TCasinoSettings}
              gameSettings={value as TCasinoSettings[keyof TCasinoSettings]}
              isAdmin={isAdmin}
            />
          ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Object.entries(settings)
          .filter(([key]) => !otherGames.includes(key))
          .map(([key, value]) => (
            <GameCard
              key={key}
              gameKey={key as keyof TCasinoSettings}
              gameSettings={value as TCasinoSettings[keyof TCasinoSettings]}
              isAdmin={isAdmin}
            />
          ))}
      </div>
    </div>
  )
}

export default GuildStats
