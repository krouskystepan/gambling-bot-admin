'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

type AtmQueueSnapshot = {
  revision: string
  pending: number
  total: number
  latestUpdatedAt: string | null
}

export function useAtmQueueLiveUpdates(
  guildId: string,
  isBusy: boolean,
  intervalMs = 20_000
) {
  const router = useRouter()
  const lastRevisionRef = useRef<string | null>(null)
  const pendingRevisionRef = useRef<string | null>(null)
  const isBusyRef = useRef(isBusy)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    isBusyRef.current = isBusy
  }, [isBusy])

  const applyRefresh = useCallback(() => {
    if (pendingRevisionRef.current) {
      lastRevisionRef.current = pendingRevisionRef.current
      pendingRevisionRef.current = null
    }
    setShowBanner(false)
    router.refresh()
  }, [router])

  const dismissBanner = useCallback(() => {
    setShowBanner(false)
  }, [])

  const checkSnapshot = useCallback(async () => {
    if (document.visibilityState !== 'visible') return

    try {
      const response = await fetch(`/api/guilds/${guildId}/atm-queue/snapshot`)
      if (!response.ok) return

      const snapshot = (await response.json()) as AtmQueueSnapshot
      const { revision } = snapshot

      if (lastRevisionRef.current === null) {
        lastRevisionRef.current = revision
        return
      }

      if (revision === lastRevisionRef.current) return

      if (!isBusyRef.current) {
        lastRevisionRef.current = revision
        pendingRevisionRef.current = null
        setShowBanner(false)
        router.refresh()
        return
      }

      pendingRevisionRef.current = revision
      setShowBanner(true)
    } catch {
      // Ignore transient polling errors.
    }
  }, [guildId, router])

  useEffect(() => {
    const runCheck = () => {
      void checkSnapshot()
    }

    const timeoutId = window.setTimeout(runCheck, 0)
    const intervalId = window.setInterval(runCheck, intervalMs)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runCheck()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [checkSnapshot, intervalMs])

  return { showBanner, applyRefresh, dismissBanner }
}
