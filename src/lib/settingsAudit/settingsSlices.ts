import type { TChannelsFormValues } from '@/types/types'

type ChannelsDocSlice = {
  atmChannelIds?: { actions?: string; logs?: string } | null
  casinoChannelIds?: string[] | null
  winAnnouncementsChannelId?: string | null
  predictionChannelIds?: { actions?: string; logs?: string } | null
  raffleChannelIds?: { actions?: string; logs?: string } | null
  workerLogChannelId?: string | null
}

export function channelsSliceFromDoc(
  doc: ChannelsDocSlice | null | undefined
): TChannelsFormValues | null {
  if (!doc) return null

  return {
    atm: {
      actions: doc.atmChannelIds?.actions ?? '',
      logs: doc.atmChannelIds?.logs ?? ''
    },
    casino: {
      casinoChannelIds: doc.casinoChannelIds ?? [],
      winAnnouncementsChannelId: doc.winAnnouncementsChannelId ?? ''
    },
    prediction: {
      actions: doc.predictionChannelIds?.actions ?? '',
      logs: doc.predictionChannelIds?.logs ?? ''
    },
    raffle: {
      actions: doc.raffleChannelIds?.actions ?? '',
      logs: doc.raffleChannelIds?.logs ?? ''
    },
    workerLogChannelId: doc.workerLogChannelId ?? ''
  }
}

export function moderationSliceFromDoc(
  doc:
    | { managerRoleId?: string | null; bannedRoleId?: string | null }
    | null
    | undefined
): { managerRoleId: string; bannedRoleId: string } | null {
  if (!doc) return null

  return {
    managerRoleId: doc.managerRoleId ?? '',
    bannedRoleId: doc.bannedRoleId ?? ''
  }
}
