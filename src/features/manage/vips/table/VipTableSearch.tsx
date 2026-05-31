import { Table } from '@tanstack/react-table'

import { ChangeEvent, RefObject } from 'react'

import { Input } from '@/components/ui/input'
import { TVipChannels } from '@/types/types'

interface VipSearchProps {
  table: Table<TVipChannels>
  inputRef: RefObject<HTMLInputElement | null>
  columnId: string
  placeholder: string
  initialValue?: string
}

const VipTableSearch = ({
  table,
  inputRef,
  columnId,
  placeholder,
  initialValue = ''
}: VipSearchProps) => {
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
      className="h-9.5 max-w-xs"
    />
  )
}

export default VipTableSearch
