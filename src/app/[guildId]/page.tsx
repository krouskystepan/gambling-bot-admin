import { notFound, redirect } from 'next/navigation'

import { getSessionOrNull, safeCallbackUrl } from '@/lib/requireSession'

type PublicGuildPageProps = {
  params: Promise<{ guildId: string }>
}

const PublicGuildPage = async ({ params }: PublicGuildPageProps) => {
  const { guildId } = await params
  const session = await getSessionOrNull()

  if (!session) {
    notFound()
  }

  redirect(safeCallbackUrl(`/dashboard/g/${guildId}/home`))
}

export default PublicGuildPage
