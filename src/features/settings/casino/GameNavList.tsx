'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { TCasinoSettingsForm, TCasinoSettingsValues } from '@/types/types'

import GameNavItem from './GameNavItem'

type NavSection = {
  title: string
  items: Array<keyof TCasinoSettingsValues>
}

type Props = {
  games: Array<keyof TCasinoSettingsValues>
  sections?: NavSection
  selectedGame: keyof TCasinoSettingsValues
  form: TCasinoSettingsForm
  onSelectGame: (game: keyof TCasinoSettingsValues) => void
}

const CASINO_NAV_LABELS: Partial<Record<keyof TCasinoSettingsValues, string>> =
  {
    winAnnouncements: 'Big wins'
  }

const panelHeaderClassName =
  'flex h-12 shrink-0 items-center border-b px-4 font-semibold leading-none'

const sectionLabelClassName =
  'px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase'

type NavItemsProps = {
  items: Array<keyof TCasinoSettingsValues>
  selectedGame: keyof TCasinoSettingsValues
  form: TCasinoSettingsForm
  onSelectGame: (game: keyof TCasinoSettingsValues) => void
  variant: 'list' | 'tile'
}

const NavItems = ({
  items,
  selectedGame,
  form,
  onSelectGame,
  variant
}: NavItemsProps) =>
  items.map((game) => (
    <GameNavItem
      key={String(game)}
      game={game}
      label={CASINO_NAV_LABELS[game]}
      form={form}
      variant={variant}
      isActive={game === selectedGame}
      onSelect={onSelectGame}
    />
  ))

const GameNavList = ({
  games,
  sections,
  selectedGame,
  form,
  onSelectGame
}: Props) => {
  const hasSections = Boolean(sections?.items.length)

  return (
    <>
      <Card className="hidden w-60 shrink-0 gap-0 overflow-hidden py-0 lg:flex">
        <div className={panelHeaderClassName}>Casino</div>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[calc(100vh-12rem)]">
            <nav className="flex flex-col gap-0.5 p-2 pb-3">
              <NavItems
                items={games}
                selectedGame={selectedGame}
                form={form}
                onSelectGame={onSelectGame}
                variant="list"
              />
              {hasSections && sections && (
                <>
                  <div className="mx-1 my-2 border-t" />
                  <p className={cn(sectionLabelClassName, 'pt-1')}>
                    {sections.title}
                  </p>
                  <NavItems
                    items={sections.items}
                    selectedGame={selectedGame}
                    form={form}
                    onSelectGame={onSelectGame}
                    variant="list"
                  />
                </>
              )}
            </nav>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0 lg:hidden">
        <div className={cn(panelHeaderClassName, 'text-sm')}>Casino</div>
        <CardContent className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <NavItems
              items={games}
              selectedGame={selectedGame}
              form={form}
              onSelectGame={onSelectGame}
              variant="tile"
            />
          </div>
          {hasSections && sections && (
            <>
              <div className="border-t" />
              <p className={sectionLabelClassName}>{sections.title}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <NavItems
                  items={sections.items}
                  selectedGame={selectedGame}
                  form={form}
                  onSelectGame={onSelectGame}
                  variant="tile"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default GameNavList
