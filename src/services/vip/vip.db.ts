import { TVipRoom } from 'gambling-bot-shared'

import VipRoom from '@/models/VipRoom'

export async function getActiveVipByOwner({
  guildId,
  ownerId
}: {
  guildId: string
  ownerId: string
}) {
  return VipRoom.findOne({
    guildId,
    ownerId,
    expiresAt: { $gt: new Date() }
  }).lean<TVipRoom>()
}

export async function getActiveVipOwnerIds(guildId: string): Promise<string[]> {
  const vips = await VipRoom.find({
    guildId,
    expiresAt: { $gt: new Date() }
  })
    .select('ownerId')
    .lean<{ ownerId: string }[]>()

  return vips.map((vip) => vip.ownerId)
}

export async function createVip({
  ownerId,
  guildId,
  channelId,
  expiresAt
}: {
  ownerId: string
  guildId: string
  channelId: string
  expiresAt: Date
}) {
  await VipRoom.create({
    ownerId,
    guildId,
    channelId,
    expiresAt
  })
}

export async function deleteVipByOwnerId({
  ownerId,
  guildId
}: {
  ownerId: string
  guildId: string
}) {
  await VipRoom.findOneAndDelete({ ownerId, guildId })
}

export async function extendVipExpiry({
  ownerId,
  guildId,
  newExpiry
}: {
  ownerId: string
  guildId: string
  newExpiry: Date
}) {
  return VipRoom.findOneAndUpdate(
    { ownerId, guildId },
    { $set: { expiresAt: newExpiry } }
  )
}

export async function addMemberToVip({
  ownerId,
  guildId,
  memberId
}: {
  ownerId: string
  guildId: string
  memberId: string
}) {
  await VipRoom.findOneAndUpdate(
    { ownerId, guildId },
    { $addToSet: { memberIds: memberId } }
  )
}
