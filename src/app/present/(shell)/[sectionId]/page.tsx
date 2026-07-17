import { redirect } from 'next/navigation'

import {
  SectionId,
  sections
} from '@/app/dashboard/g/[guildId]/[sectionId]/sections'
import NotFoundBox from '@/components/states/NotFoundBox'
import { DEMO_GUILD_ID } from '@/lib/presentation'

type PresentSectionPageProps = {
  params: Promise<{ sectionId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

/**
 * Presentation mirror of the dashboard section dispatcher. Reuses the exact same
 * section components, but grants full (admin + manager + dev) access implicitly
 * and always renders the demo guild — no Discord auth or permission checks.
 */
const PresentSectionPage = async ({
  params,
  searchParams
}: PresentSectionPageProps) => {
  const { sectionId } = await params
  const resolvedSearchParams = await searchParams

  if (sectionId === 'dev-discord') {
    redirect('/present/dev-guild')
  }

  const Section = sections[sectionId as SectionId]
  if (!Section) return <NotFoundBox />

  return <Section guildId={DEMO_GUILD_ID} searchParams={resolvedSearchParams} />
}

export default PresentSectionPage
