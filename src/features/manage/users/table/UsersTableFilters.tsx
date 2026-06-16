import { Table as ReactTable } from '@tanstack/react-table'
import { RefreshCcw } from 'lucide-react'

import { Dispatch, RefObject, SetStateAction } from 'react'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TGuildMemberStatus } from '@/types/types'

import UserTableSearch from './UserTableSearch'

const UserTableFilters = ({
  table,
  isLoading,
  setIsLoading,
  searchRef
}: {
  table: ReactTable<TGuildMemberStatus>
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  searchRef: RefObject<HTMLInputElement | null>
}) => {
  const router = useRouter()

  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <UserTableSearch
        table={table}
        inputRef={searchRef}
        columnId="search"
        placeholder="Search by username, nickname or ID..."
        initialValue={searchValue}
      />

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
  )
}

export default UserTableFilters
