import NotFoundBox from '@/components/states/NotFoundBox'

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

  return <Section guildId={guildId} searchParams={resolvedSearchParams} />
}

export default SectionPage
