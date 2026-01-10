'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export const useUpdateUrl = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (updates: Partial<Record<string, string | number | undefined>>) => {
    const currentParams = Object.fromEntries(searchParams.entries())
    const params = new URLSearchParams(currentParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false
    })
  }
}
