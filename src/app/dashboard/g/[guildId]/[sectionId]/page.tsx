import { redirect } from 'next/navigation'

import { getUserPermissions } from '@/actions/perms'
import NotFoundBox from '@/components/states/NotFoundBox'
import { canAccessSection } from '@/lib/guildSectionAccess'
import { requireSession } from '@/lib/requireSession'

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
    return null
  }

  if (!canAccessSection(sectionId as SectionId, { isAdmin, isManager })) {
    redirect(
      isAdmin || isManager ? `/dashboard/g/${guildId}/home` : '/dashboard'
    )
  }

  return <Section guildId={guildId} searchParams={resolvedSearchParams} />
}

export default SectionPage
