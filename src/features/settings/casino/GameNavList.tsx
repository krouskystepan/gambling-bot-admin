'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { TCasinoSettingsForm, TCasinoSettingsValues } from '@/types/types'

import GameNavItem from './GameNavItem'

type Props = {
  games: Array<keyof TCasinoSettingsValues>
  selectedGame: keyof TCasinoSettingsValues
  form: TCasinoSettingsForm
  onSelectGame: (game: keyof TCasinoSettingsValues) => void
}

const panelHeaderClassName =
  'flex h-12 shrink-0 items-center border-b px-4 font-semibold leading-none'

const GameNavList = ({ games, selectedGame, form, onSelectGame }: Props) => (
  <>
    <Card className="hidden w-60 shrink-0 gap-0 overflow-hidden py-0 lg:flex">
      <div className={panelHeaderClassName}>Games</div>
      <CardContent className="p-0">
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
      </CardContent>
    </Card>

    <Card className="gap-0 overflow-hidden py-0 lg:hidden">
      <div className={cn(panelHeaderClassName, 'text-sm')}>Games</div>
      <CardContent className="p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
      </CardContent>
    </Card>
  </>
)

export default GameNavList
