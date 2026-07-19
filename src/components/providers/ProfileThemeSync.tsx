'use client'

import { useTheme } from 'next-themes'

import { useEffect } from 'react'

import { useProfilePreferences } from '@/lib/preferences/profilePreferences'

/**
 * Keeps next-themes in sync with the profile preferences store.
 * Mount inside ThemeProvider.
 */
export function ProfileThemeSync() {
  const { setTheme, theme } = useTheme()
  const { preferences } = useProfilePreferences()

  useEffect(() => {
    if (theme !== preferences.theme) {
      setTheme(preferences.theme)
    }
  }, [preferences.theme, setTheme, theme])

  return null
}
