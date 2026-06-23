'use client'

import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { useMemo, useState } from 'react'

import Image from 'next/image'

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

export type SearchableUserOption = {
  userId: string
  username: string
  nickname?: string | null
  avatarUrl?: string
}

type SearchableUserFilterProps = {
  members: SearchableUserOption[]
  value?: string
  onChange: (userId: string | undefined) => void
  placeholder?: string
  clearLabel?: string
  className?: string
}

const DISCORD_ID_PATTERN = /^\d{17,20}$/

function memberLabel(member: SearchableUserOption) {
  return member.nickname
    ? `${member.username} (${member.nickname})`
    : member.username
}

function MemberOptionLabel({ member }: { member: SearchableUserOption }) {
  if (member.nickname) {
    return (
      <span className="min-w-0 flex-1">
        <span className="block leading-tight">{member.username}</span>
        <span className="text-muted-foreground block text-xs leading-snug break-words">
          {member.nickname}
        </span>
      </span>
    )
  }

  return (
    <span className="min-w-0 flex-1 leading-snug break-words">
      {member.username}
    </span>
  )
}

const SearchableUserFilter = ({
  members,
  value,
  onChange,
  placeholder = 'All users',
  clearLabel = 'All users',
  className
}: SearchableUserFilterProps) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedMember = useMemo(
    () => members.find((member) => member.userId === value),
    [members, value]
  )

  const trimmedQuery = query.trim()
  const showIdOption =
    trimmedQuery.length > 0 &&
    DISCORD_ID_PATTERN.test(trimmedQuery) &&
    !members.some((member) => member.userId === trimmedQuery)

  const triggerLabel = selectedMember
    ? memberLabel(selectedMember)
    : value
      ? value
      : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          title={value ? triggerLabel : undefined}
          className={cn(
            fieldControlVariants(),
            'text-foreground flex h-9.5 w-44 shrink-0 items-center justify-between gap-2 px-3 py-2 font-normal',
            className
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
            {selectedMember?.avatarUrl ? (
              <Image
                src={selectedMember.avatarUrl}
                alt={selectedMember.username}
                width={20}
                height={20}
                className="size-5 shrink-0 rounded-full"
              />
            ) : null}
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
        className="w-80 min-w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-0"
        align="start"
      >
        <Command shouldFilter>
          <CommandInput
            placeholder="Search by name or ID..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No member found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={clearLabel}
                className="items-center py-1.5"
                onSelect={() => {
                  onChange(undefined)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <CheckIcon
                  className={cn('size-4', !value ? 'opacity-100' : 'opacity-0')}
                />
                {clearLabel}
              </CommandItem>
              {showIdOption ? (
                <CommandItem
                  value={`id ${trimmedQuery}`}
                  className="items-center py-1.5"
                  onSelect={() => {
                    onChange(trimmedQuery)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      'size-4',
                      value === trimmedQuery ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  Use ID: {trimmedQuery}
                </CommandItem>
              ) : null}
              {members.map((member) => (
                <CommandItem
                  key={member.userId}
                  className="items-center py-2"
                  value={`${member.username} ${member.nickname ?? ''} ${member.userId}`}
                  onSelect={() => {
                    onChange(member.userId)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      'size-4 shrink-0',
                      value === member.userId ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt={member.username}
                      width={20}
                      height={20}
                      className="size-5 shrink-0 rounded-full"
                    />
                  ) : null}
                  <MemberOptionLabel member={member} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default SearchableUserFilter
