'use client'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import {
  type OverviewDateRange,
  getReportsSearchablePresetGroups
} from '../../overview/period'

type ReportsSearchablePeriodSelectProps = {
  timezone: string
  activeLabel: string | null
  onSelect: (range: OverviewDateRange) => void
}

const ReportsSearchablePeriodSelect = ({
  timezone,
  activeLabel,
  onSelect
}: ReportsSearchablePeriodSelectProps) => {
  const [open, setOpen] = useState(false)
  const groups = getReportsSearchablePresetGroups(timezone)
  const searchableLabels = new Set(
    groups.flatMap((group) => group.presets.map((preset) => preset.label))
  )
  const selectedLabel =
    activeLabel && searchableLabels.has(activeLabel) ? activeLabel : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between font-normal"
        >
          <span className="truncate">
            {selectedLabel ?? 'Year or quarter...'}
          </span>
          <ChevronsUpDownIcon className="text-muted-foreground size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search year or quarter..." />
          <CommandList>
            <CommandEmpty>No period found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.presets.map((preset) => (
                  <CommandItem
                    key={preset.label}
                    value={preset.label}
                    onSelect={() => {
                      onSelect(preset.match())
                      setOpen(false)
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'size-4',
                        selectedLabel === preset.label
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {preset.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ReportsSearchablePeriodSelect
