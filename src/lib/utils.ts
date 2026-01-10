import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumberToReadableString = (number: number): string => {
  const abs = Math.abs(number)

  const roundTo = (num: number, digits = 2) =>
    Math.round(num * 10 ** digits) / 10 ** digits

  let formatted: string

  if (abs >= 1_000_000_000) {
    formatted = `${roundTo(abs / 1_000_000_000)}B`
  } else if (abs >= 1_000_000) {
    formatted = `${roundTo(abs / 1_000_000)}M`
  } else if (abs >= 1_000) {
    formatted = `${roundTo(abs / 1_000)}k`
  } else {
    formatted = roundTo(abs).toString()
  }

  return number < 0 ? `-${formatted}` : formatted
}

export const formatNumberWithSpaces = (num: number): string =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export function getReadableName(
  key: string,
  map: { name: string; value: string }[]
): string {
  const found = map.find((item) => item.value === key)
  return found ? found.name : key
}
