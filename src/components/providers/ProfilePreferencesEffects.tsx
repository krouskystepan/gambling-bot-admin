'use client'

import { useEffect } from 'react'

import { useProfilePreferences } from '@/lib/preferences/profilePreferences'

/** Applies document-level preference attributes (table density, reduce motion). */
export function ProfilePreferencesEffects({
  children
}: {
  children: React.ReactNode
}) {
  const { preferences } = useProfilePreferences()

  useEffect(() => {
    document.documentElement.dataset.tableDensity = preferences.tableDensity
    document.documentElement.dataset.reduceMotion = String(
      preferences.reduceMotion
    )
  }, [preferences.reduceMotion, preferences.tableDensity])

  return children
}
