'use client'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { useMemo, useState } from 'react'

import Image from 'next/image'

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

export type GuildMemberOption = {
  userId: string
  username: string
  nickname: string | null
  avatarUrl: string
}

type GuildMemberComboboxProps = {
  members: GuildMemberOption[]
  value: string | null
  onChange: (userId: string) => void
  excludeIds?: string[]
  placeholder?: string
  disabled?: boolean
}

const GuildMemberCombobox = ({
  members,
  value,
  onChange,
  excludeIds = [],
  placeholder = 'Select member...',
  disabled = false
}: GuildMemberComboboxProps) => {
  const [open, setOpen] = useState(false)

  const excluded = useMemo(() => new Set(excludeIds), [excludeIds])

  const availableMembers = useMemo(
    () => members.filter((member) => !excluded.has(member.userId)),
    [members, excluded]
  )

  const selectedMember = members.find((member) => member.userId === value)

  const label = (member: GuildMemberOption) =>
    member.nickname
      ? `${member.username} (${member.nickname})`
      : member.username

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selectedMember ? (
            <span className="flex items-center gap-2 truncate">
              <Image
                src={selectedMember.avatarUrl}
                alt={selectedMember.username}
                width={20}
                height={20}
                className="rounded-full"
              />
              {label(selectedMember)}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDownIcon className="text-muted-foreground size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandList>
            <CommandEmpty>No member found.</CommandEmpty>
            <CommandGroup>
              {availableMembers.map((member) => (
                <CommandItem
                  key={member.userId}
                  value={`${member.username} ${member.nickname ?? ''} ${member.userId}`}
                  onSelect={() => {
                    onChange(member.userId)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      'size-4',
                      value === member.userId ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Image
                    src={member.avatarUrl}
                    alt={member.username}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span className="truncate">{label(member)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default GuildMemberCombobox
