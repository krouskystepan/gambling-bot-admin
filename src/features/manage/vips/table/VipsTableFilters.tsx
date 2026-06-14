'use client'

import { Table as ReactTable } from '@tanstack/react-table'
import { PlusIcon, RefreshCcw } from 'lucide-react'

import { Dispatch, RefObject, SetStateAction, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TVipChannels } from '@/types/types'

import CreateVipDialog from './CreateVipDialog'
import { type GuildMemberOption } from './GuildMemberCombobox'
import VipTableSearch from './VipTableSearch'

const VipsTableFilters = ({
  guildId,
  table,
  isLoading,
  setIsLoading,
  searchRef,
  vipConfigured,
  vipFeatureBlocked,
  vipFeatureBlockMessage,
  activeVipOwnerIds,
  members
}: {
  guildId: string
  table: ReactTable<TVipChannels>
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  searchRef: RefObject<HTMLInputElement | null>
  vipConfigured: boolean
  vipFeatureBlocked: boolean
  vipFeatureBlockMessage: string | null
  activeVipOwnerIds: string[]
  members: GuildMemberOption[]
}) => {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)

  const createDisabled = !vipConfigured || vipFeatureBlocked

  const createTooltip = vipFeatureBlocked
    ? vipFeatureBlockMessage
    : !vipConfigured
      ? `Configure VIP settings first in VIP settings.`
      : 'Create a VIP room for a registered user'

  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <VipTableSearch
          table={table}
          inputRef={searchRef}
          columnId="search"
          placeholder="Search by username, nickname, channel or IDs..."
          initialValue={searchValue}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  disabled={createDisabled}
                  onClick={() => setCreateOpen(true)}
                >
                  <PlusIcon className="-ms-1 opacity-60" size={16} />
                  Create VIP room
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {!vipConfigured && !vipFeatureBlocked ? (
                <p>
                  Configure VIP settings first in{' '}
                  <Link
                    href={`/dashboard/g/${guildId}/vip-settings`}
                    className="underline"
                  >
                    VIP settings
                  </Link>
                  .
                </p>
              ) : (
                <p>{createTooltip}</p>
              )}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                disabled={isLoading}
                onClick={() => {
                  setIsLoading(true)
                  const url = new URL(window.location.href)
                  router.replace(url.pathname + url.search, { scroll: false })
                }}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh data</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <CreateVipDialog
        guildId={guildId}
        members={members}
        activeVipOwnerIds={activeVipOwnerIds}
        vipConfigured={vipConfigured}
        vipFeatureBlocked={vipFeatureBlocked}
        vipFeatureBlockMessage={vipFeatureBlockMessage}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  )
}

export default VipsTableFilters
