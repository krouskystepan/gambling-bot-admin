import { NextResponse } from 'next/server'

import { getAtmQueueSnapshot } from '@/lib/atmQueue/getAtmQueueSnapshot'
import { requireExportAccess } from '@/lib/export/exportAuth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params
  const access = await requireExportAccess(guildId)
  if ('error' in access) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const snapshot = await getAtmQueueSnapshot(guildId)
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('ATM queue snapshot failed:', error)
    const message =
      error instanceof Error ? error.message : 'ATM queue snapshot failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
