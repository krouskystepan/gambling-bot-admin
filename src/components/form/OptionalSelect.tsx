'use client'

import { ReactNode } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  SELECT_NONE_VALUE,
  fromSelectValue,
  toSelectValue
} from '@/lib/optionalSelect'

type Props = {
  value: string | undefined
  onValueChange: (value: string) => void
  placeholder?: string
  children: ReactNode
  className?: string
}

const OptionalSelect = ({
  value,
  onValueChange,
  placeholder = 'None',
  children,
  className
}: Props) => (
  <Select
    value={toSelectValue(value)}
    onValueChange={(next) => onValueChange(fromSelectValue(next))}
  >
    <SelectTrigger variant="muted" className={className}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={SELECT_NONE_VALUE}>None</SelectItem>
      {children}
    </SelectContent>
  </Select>
)

export default OptionalSelect
