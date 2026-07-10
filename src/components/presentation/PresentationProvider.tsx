'use client'

import { ReactNode, createContext, useContext, useMemo } from 'react'

type PresentationContextValue = {
  readOnly: boolean
}

const PresentationContext = createContext<PresentationContextValue>({
  readOnly: false
})

export function PresentationProvider({ children }: { children: ReactNode }) {
  const value = useMemo<PresentationContextValue>(
    () => ({ readOnly: true }),
    []
  )
  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  )
}

/**
 * Returns `true` only when rendered inside a {@link PresentationProvider}
 * (i.e. under `/present/*`). Outside the provider it defaults to `false`, so
 * dashboard components are unaffected without any wiring.
 */
export function usePresentationReadOnly(): boolean {
  return useContext(PresentationContext).readOnly
}
