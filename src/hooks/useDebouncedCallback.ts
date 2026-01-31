import { useCallback, useEffect, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay = 400
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return debouncedFn
}
