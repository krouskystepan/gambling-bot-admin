import { Table } from '@tanstack/react-table'

import { ChangeEvent, RefObject } from 'react'

import { TABLE_SEARCH_INPUT_CLASS } from '@/components/table/tableSearchStyles'
import { Input } from '@/components/ui/input'
import { TRaffleRow } from '@/types/types'

interface RaffleTableSearchProps {
  table: Table<TRaffleRow>
  inputRef: RefObject<HTMLInputElement | null>
  columnId: string
  placeholder: string
  initialValue?: string
}

const RaffleTableSearch = ({
  table,
  inputRef,
  columnId,
  placeholder,
  initialValue = ''
}: RaffleTableSearchProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    table.getColumn(columnId)?.setFilterValue(value || undefined)
  }

  return (
    <Input
      ref={inputRef}
      value={initialValue}
      placeholder={placeholder}
      onChange={handleChange}
      className={TABLE_SEARCH_INPUT_CLASS}
    />
  )
}

export default RaffleTableSearch
