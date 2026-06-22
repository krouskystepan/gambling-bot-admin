import { FilterIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  canSelectFacetValue,
  getVisibleFacetOptions
} from '@/lib/table/facetFilters'

type Option<T = string> = {
  value: string
  label: string
  realValue: T
}

interface TransactionFilterProps<T extends string> {
  title: string
  options: Option<T>[]
  selected: Option<T>[]
  counts: Record<T, number>
  columnId: string
  onChange: (next: Option<T>[]) => void
}

const TransactionTableFilter = <T extends string>({
  title,
  options,
  selected,
  counts,
  columnId,
  onChange
}: TransactionFilterProps<T>) => {
  const visibleOptions = getVisibleFacetOptions(options, selected, counts)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9.5">
          <FilterIcon
            className="-ms-1 opacity-60"
            size={16}
            aria-hidden="true"
          />
          {title}
          {selected.length > 0 && (
            <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-36 p-3" align="start">
        <div className="space-y-3">
          <div className="text-muted-foreground text-xs font-medium">
            Filter by {title}
          </div>
          <div className="space-y-3">
            {visibleOptions.length ? (
              visibleOptions.map((option, i) => {
                const count = counts[option.realValue] ?? 0
                const isSelected = selected.some(
                  (entry) => entry.realValue === option.realValue
                )
                const canSelect =
                  isSelected || canSelectFacetValue(option.realValue, counts)

                return (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`${columnId}-${i}`}
                      checked={isSelected}
                      disabled={!canSelect}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          if (!canSelectFacetValue(option.realValue, counts)) {
                            return
                          }

                          onChange([...selected, option])
                          return
                        }

                        onChange(
                          selected.filter(
                            (entry) => entry.realValue !== option.realValue
                          )
                        )
                      }}
                    />
                    <Label
                      htmlFor={`${columnId}-${i}`}
                      className="flex grow justify-between gap-2 font-normal"
                    >
                      {option.label}
                      <span className="text-muted-foreground ms-2 text-xs">
                        {count}
                      </span>
                    </Label>
                  </div>
                )
              })
            ) : (
              <p className="text-muted-foreground text-xs">
                No options match the current filters.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default TransactionTableFilter
