import { redirect } from 'next/navigation'

import { getUserPermissions } from '@/actions/perms'
import NotFoundBox from '@/components/states/NotFoundBox'
import RateLimited from '@/components/states/RateLimmited'
import { requireSession } from '@/lib/auth/requireSession'
import { canAccessSection } from '@/lib/guild/guildSectionAccess'

import { SectionId, sections } from './sections'

type SectionPageProps = {
  params: Promise<{
    guildId: string
    sectionId: string
  }>
  searchParams: Promise<Record<string, string | undefined>>
}

const SectionPage = async ({ params, searchParams }: SectionPageProps) => {
  const { guildId, sectionId } = await params
  const resolvedSearchParams = await searchParams

  const Section = sections[sectionId as SectionId]
  if (!Section) return <NotFoundBox />

  const session = await requireSession()
  const { isAdmin, isManager, rateLimited } = await getUserPermissions(
    guildId,
    session
  )

  if (rateLimited) {
    return <RateLimited />
  }

  if (!canAccessSection(sectionId as SectionId, { isAdmin, isManager })) {
    redirect(
      isAdmin || isManager ? `/dashboard/g/${guildId}/overview` : '/dashboard'
    )
  }

  return <Section guildId={guildId} searchParams={resolvedSearchParams} />
}

export default SectionPage
