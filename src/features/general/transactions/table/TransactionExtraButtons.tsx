import { Table } from '@tanstack/react-table'
import { Eraser, RefreshCcw } from 'lucide-react'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TTransactionDiscord } from '@/types/types'

const TransactionExtraButtons = ({
  table,
  isLoading,
  setIsLoading
}: {
  table: Table<TTransactionDiscord>
  isLoading: boolean
  setIsLoading: (value: boolean) => void
}) => {
  const router = useRouter()
  const handleClearFilters = () => {
    table.resetColumnFilters()
    table.resetGlobalFilter()

    router.replace(`${window.location.pathname}`, { scroll: false })
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="flex h-9.5 items-center justify-center"
            variant="secondary"
            size="icon"
            onClick={handleClearFilters}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clear filters</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            onClick={() => {
              setIsLoading(true)
              const url = new URL(window.location.href)
              router.replace(url.pathname + url.search, { scroll: false })
            }}
            className="flex h-9.5 items-center justify-between"
            disabled={isLoading}
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Refresh Data</p>
        </TooltipContent>
      </Tooltip>
    </>
  )
}

export default TransactionExtraButtons
