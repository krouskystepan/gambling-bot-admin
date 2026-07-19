'use client'

import { SessionProvider } from 'next-auth/react'

import { ProfilePreferencesEffects } from '@/components/providers/ProfilePreferencesEffects'
import { ProfileThemeSync } from '@/components/providers/ProfileThemeSync'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ProfileThemeSync />
      <ProfilePreferencesEffects>
        <SessionProvider>{children}</SessionProvider>
      </ProfilePreferencesEffects>
    </ThemeProvider>
  )
}
