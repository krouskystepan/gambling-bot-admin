import { Table as ReactTable } from '@tanstack/react-table'
import { PlusIcon, RefreshCcw } from 'lucide-react'

import { Dispatch, RefObject, SetStateAction } from 'react'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TVipChannels } from '@/types/types'

import VipTableSearch from './VipTableSearch'

const VipsTableFilters = ({
  table,
  isLoading,
  setIsLoading,
  searchRef
}: {
  table: ReactTable<TVipChannels>
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
      <VipTableSearch
        table={table}
        inputRef={searchRef}
        columnId="search"
        placeholder="Search by username, nickname, channel or IDs..."
        initialValue={searchValue}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled>
          <PlusIcon className="-ms-1 opacity-60" size={16} />
          Add user
        </Button>

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
  )
}

export default VipsTableFilters
