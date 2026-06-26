'use client'

import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { useId, useMemo, useState } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { fieldControlVariants } from '@/components/ui/field-styles'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type SearchableTextOption = {
  value: string
  label: string
  sublabel?: string
}

type SearchableTextFilterProps = {
  options: SearchableTextOption[]
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  clearLabel?: string
  inputPlaceholder?: string
  className?: string
}

function OptionLabel({ option }: { option: SearchableTextOption }) {
  if (option.sublabel) {
    return (
      <span className="min-w-0 flex-1">
        <span className="block leading-tight">{option.label}</span>
        <span className="text-muted-foreground block text-xs leading-snug wrap-break-word">
          {option.sublabel}
        </span>
      </span>
    )
  }

  return (
    <span className="min-w-0 flex-1 leading-snug wrap-break-word">
      {option.label}
    </span>
  )
}

const SearchableTextFilter = ({
  options,
  value,
  onChange,
  placeholder = 'All',
  clearLabel = 'All',
  inputPlaceholder = 'Search...',
  className
}: SearchableTextFilterProps) => {
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  const trimmedQuery = query.trim()
  const showCustomOption =
    trimmedQuery.length > 0 &&
    !options.some(
      (option) =>
        option.value.toLowerCase() === trimmedQuery.toLowerCase() ||
        option.label.toLowerCase() === trimmedQuery.toLowerCase()
    )

  const triggerLabel = selectedOption
    ? selectedOption.sublabel
      ? `${selectedOption.label} (${selectedOption.sublabel})`
      : selectedOption.label
    : value
      ? value
      : placeholder

  const applyValue = (next: string | undefined) => {
    onChange(next)
    setQuery('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          title={value ? triggerLabel : undefined}
          className={cn(
            fieldControlVariants(),
            'text-foreground flex h-9.5 w-44 shrink-0 items-center justify-between gap-2 px-3 py-2 font-normal',
            className
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
            <span className={cn('truncate', !value && 'text-muted-foreground')}>
              {triggerLabel}
            </span>
          </span>
          <ChevronDownIcon
            size={16}
            className="text-muted-foreground/80 shrink-0"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id={listboxId}
        className="w-80 min-w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-0"
        align="start"
      >
        <Command shouldFilter>
          <CommandInput
            placeholder={inputPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={clearLabel}
                className="items-center py-1.5"
                onSelect={() => applyValue(undefined)}
              >
                <CheckIcon
                  className={cn('size-4', !value ? 'opacity-100' : 'opacity-0')}
                />
                {clearLabel}
              </CommandItem>
              {showCustomOption ? (
                <CommandItem
                  value={`search ${trimmedQuery}`}
                  className="items-center py-1.5"
                  onSelect={() => applyValue(trimmedQuery)}
                >
                  <CheckIcon
                    className={cn(
                      'size-4',
                      value === trimmedQuery ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  Search: {trimmedQuery}
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  className="items-center py-2"
                  value={`${option.label} ${option.sublabel ?? ''} ${option.value}`}
                  onSelect={() => applyValue(option.value)}
                >
                  <CheckIcon
                    className={cn(
                      'size-4 shrink-0',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <OptionLabel option={option} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default SearchableTextFilter
