import { RefreshCcw, X } from 'lucide-react'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'

const TransactionExtraButtons = ({
  isLoading,
  setIsLoading
}: {
  isLoading: boolean
  setIsLoading: (value: boolean) => void
}) => {
  const router = useRouter()
  const updateUrl = useUpdateUrl()

  const handleClearFilters = () => {
    updateUrl({
      page: 1,
      search: undefined,
      adminSearch: undefined,
      filterType: undefined,
      filterSource: undefined,
      dateFrom: undefined,
      dateTo: undefined
    })
  }

  return (
    <>
      {/* <Tooltip>
        <TooltipTrigger asChild> */}
      <Button
        className="flex h-9.5 items-center justify-center"
        variant="secondary"
        size="icon"
        onClick={handleClearFilters}
      >
        <X className="h-4 w-4" />
      </Button>
      {/* </TooltipTrigger>
        <TooltipContent>
          <p>Clear filters</p>
        </TooltipContent>
      </Tooltip> */}

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
        <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </>
  )
}

export default TransactionExtraButtons
