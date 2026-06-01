'use client'

import { UseFormReturn } from 'react-hook-form'

import { ScrollArea } from '@/components/ui/scroll-area'
import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

import GameNavItem from './GameNavItem'

type Props = {
  games: Array<keyof TCasinoSettingsValues>
  selectedGame: keyof TCasinoSettingsValues
  form: UseFormReturn<TCasinoSettingsOutput>
  onSelectGame: (game: keyof TCasinoSettingsValues) => void
}

const GameNavList = ({
  games,
  selectedGame,
  form,
  onSelectGame
}: Props) => (
  <>
    <div className="hidden w-60 shrink-0 flex-col rounded-lg border lg:flex">
      <div className="border-b px-4 py-3 text-sm font-semibold">Games</div>
      <ScrollArea className="max-h-[calc(100vh-12rem)]">
        <nav className="flex flex-col gap-1 p-2">
          {games.map((game) => (
            <GameNavItem
              key={String(game)}
              game={game}
              form={form}
              isActive={game === selectedGame}
              onSelect={onSelectGame}
            />
          ))}
        </nav>
      </ScrollArea>
    </div>

    <div className="rounded-lg border lg:hidden">
      <div className="border-b px-4 py-3 text-sm font-semibold">Games</div>
      <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
        {games.map((game) => (
          <GameNavItem
            key={String(game)}
            game={game}
            form={form}
            variant="tile"
            isActive={game === selectedGame}
            onSelect={onSelectGame}
          />
        ))}
      </div>
    </div>
  </>
)

export default GameNavList
