'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import OpeningGuild from '@/components/states/OpeningGuild'
import {
  DEFAULT_PROFILE_PREFERENCES,
  useProfilePreferences
} from '@/lib/preferences/profilePreferences'

type GuildLandingRedirectProps = {
  guildId: string
}

const GuildLandingRedirect = ({ guildId }: GuildLandingRedirectProps) => {
  const router = useRouter()
  const { preferences } = useProfilePreferences()

  useEffect(() => {
    const section =
      preferences.landingSection || DEFAULT_PROFILE_PREFERENCES.landingSection
    router.replace(`/dashboard/g/${guildId}/${section}`)
  }, [guildId, preferences.landingSection, router])

  return <OpeningGuild />
}

export default GuildLandingRedirect
