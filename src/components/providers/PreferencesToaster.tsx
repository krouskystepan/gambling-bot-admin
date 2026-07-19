'use client'

import { Toaster } from '@/components/ui/sonner'
import { useProfilePreferences } from '@/lib/preferences/profilePreferences'

export function PreferencesToaster() {
  const { preferences } = useProfilePreferences()

  return (
    <Toaster
      richColors={preferences.richToasts}
      position={preferences.toastPosition}
    />
  )
}
