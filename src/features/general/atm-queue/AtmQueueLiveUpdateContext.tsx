'use client'

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

type AtmQueueLiveUpdateContextValue = {
  isBusy: boolean
  registerBusy: (id: string) => void
  unregisterBusy: (id: string) => void
}

const AtmQueueLiveUpdateContext =
  createContext<AtmQueueLiveUpdateContextValue | null>(null)

export function AtmQueueLiveUpdateProvider({
  children
}: {
  children: ReactNode
}) {
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set())

  const registerBusy = useCallback((id: string) => {
    setBusyIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const unregisterBusy = useCallback((id: string) => {
    setBusyIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      isBusy: busyIds.size > 0,
      registerBusy,
      unregisterBusy
    }),
    [busyIds, registerBusy, unregisterBusy]
  )

  return (
    <AtmQueueLiveUpdateContext.Provider value={value}>
      {children}
    </AtmQueueLiveUpdateContext.Provider>
  )
}

export function useAtmQueueLiveUpdateContext() {
  const context = useContext(AtmQueueLiveUpdateContext)
  if (!context) {
    throw new Error(
      'useAtmQueueLiveUpdateContext must be used within AtmQueueLiveUpdateProvider'
    )
  }
  return context
}

export function useRegisterAtmQueueBusy(id: string, active: boolean) {
  const { registerBusy, unregisterBusy } = useAtmQueueLiveUpdateContext()

  useEffect(() => {
    if (!active) return
    registerBusy(id)
    return () => unregisterBusy(id)
  }, [active, id, registerBusy, unregisterBusy])
}
