import { SortingState } from '@tanstack/react-table'
import { type ClassValue, clsx } from 'clsx'
import {
  formatNumberToReadableString,
  formatNumberWithSpaces,
  getReadableName
} from 'gambling-bot-shared'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { formatNumberToReadableString, formatNumberWithSpaces, getReadableName }

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseSortingFromUrl(param: string | null): SortingState {
  if (!param) return []

  return param.split(',').map((entry) => {
    const [id, dir] = entry.split(':')
    return {
      id,
      desc: dir === 'desc'
    }
  })
}
