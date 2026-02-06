'use server'

import { TUser } from 'gambling-bot-shared'
import { Session } from 'next-auth'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/db'
import { escapeRegExp, formatNumberToReadableString } from '@/lib/utils'
import GuildConfiguration from '@/models/GuildConfiguration'
import Transaction from '@/models/Transaction'
import User from '@/models/User'
import { TGuildMemberStatus } from '@/types/types'

import { getDiscordGuildMembers } from '../discord/member.action'
import { sendEmbed } from '../discord/utils.action'

export async function registerUser(
  userId: string,
  guildId: string,
  managerId: string
) {
  try {
    const existingUser = await User.findOne({ userId, guildId })
    if (existingUser)
      return { success: false, message: 'User already registered.' }

    const newUser = new User({ userId, guildId })
    await newUser.save()

    const guildConfig = await GuildConfiguration.findOne({ guildId })
    const logChannelId = guildConfig?.atmChannelIds.logs

    if (!logChannelId) return { success: false, message: 'ATM Logs not set.' }

    try {
      await sendEmbed(
        logChannelId,
        'ATM - User Registered via Web',
        `Manager <@${managerId}> has successfully registered <@${userId}>.`,
        0x95a5a6
      )
    } catch (logErr) {
      console.error('Failed to send log message:', logErr)
    }

    revalidatePath(`/dashboard/g/${guildId}`)

    return { success: true, message: 'User successfully registered.' }
  } catch (err) {
    console.error('Error registering user:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}

// Only delete from db.
export async function unregisterUser(
  userId: string,
  guildId: string,
  managerId: string
) {
  try {
    const existingUser = await User.findOne({ userId, guildId })
    if (!existingUser)
      return { success: false, message: 'User is not registered.' }

    await User.deleteOne({ userId, guildId })

    const guildConfig = await GuildConfiguration.findOne({ guildId })
    const logChannelId = guildConfig?.atmChannelIds.logs

    if (!logChannelId) return { success: false, message: 'ATM Logs not set.' }

    try {
      await sendEmbed(
        logChannelId,
        'ATM - User Unregistered via Web',
        `Manager <@${managerId}> has successfully unregistered <@${userId}>.`,
        0x23272a
      )
    } catch (logErr) {
      console.error('Failed to send log message:', logErr)
    }

    revalidatePath(`/dashboard/g/${guildId}`)

    return { success: true, message: 'User successfully unregistered.' }
  } catch (err) {
    console.error('Error unregistering user:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}

export async function depositBalance(
  userId: string,
  guildId: string,
  managerId: string,
  amount: number
) {
  try {
    const user = await User.findOne({ userId, guildId })
    if (!user) return { success: false, message: 'User not registered.' }

    user.balance += amount
    await user.save()

    await Transaction.create({
      userId,
      guildId,
      amount: amount,
      type: 'deposit',
      source: 'web',
      handledBy: managerId,
      createdAt: new Date()
    })

    const guildConfig = await GuildConfiguration.findOne({ guildId })
    const logChannelId = guildConfig?.atmChannelIds.logs
    const actionsChannelId = guildConfig?.atmChannelIds.actions

    if (logChannelId) {
      try {
        await sendEmbed(
          logChannelId,
          'ATM - Deposit Balance via Web',
          `Manager <@${managerId}> successfully added **$${formatNumberToReadableString(
            amount
          )}** to <@${userId}>.\nTheir new balance is now: **$${formatNumberToReadableString(
            user.balance
          )}**.`,
          0x57f287
        )
      } catch {
        return { success: false, message: 'Failed to send log message' }
      }
    }

    if (actionsChannelId) {
      try {
        await sendEmbed(
          actionsChannelId,
          'ATM - Deposit Balance via Web',
          `An administrator has added **$${formatNumberToReadableString(
            amount
          )}** to <@${userId}>'s balance.\n` +
            `**New Balance:** $${formatNumberToReadableString(user.balance)}`,
          0x57f287,
          userId
        )
      } catch {
        return { success: false, message: 'Failed to send action message' }
      }
    }

    return { success: true, message: `Deposited $${amount} to user.` }
  } catch (err) {
    console.error('Error depositing balance:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}

export async function withdrawBalance(
  userId: string,
  guildId: string,
  managerId: string,
  amount: number
) {
  try {
    const user = await User.findOne({ userId, guildId })
    if (!user) return { success: false, message: 'User not registered.' }

    if (user.balance < amount) {
      return { success: false, message: 'User has insufficient balance.' }
    }

    user.balance -= amount
    await user.save()

    await Transaction.create({
      userId,
      guildId,
      amount: amount,
      type: 'withdraw',
      source: 'web',
      handledBy: managerId,
      createdAt: new Date()
    })

    const guildConfig = await GuildConfiguration.findOne({ guildId })
    const logChannelId = guildConfig?.atmChannelIds.logs
    const actionsChannelId = guildConfig?.atmChannelIds.actions
    if (logChannelId) {
      try {
        await sendEmbed(
          logChannelId,
          'ATM - Withdraw Balance via Web',
          `Manager <@${managerId}> successfully removed **$${formatNumberToReadableString(
            amount
          )}** from <@${userId}>.\nTheir new balance is now: **$${formatNumberToReadableString(
            user.balance
          )}**.`,
          0x57f287
        )
      } catch {
        return { success: false, message: 'Failed to send log message' }
      }
    }

    if (actionsChannelId) {
      try {
        await sendEmbed(
          actionsChannelId,
          'ATM - Withdraw Balance via Web',
          `An administrator has removed **$${formatNumberToReadableString(
            amount
          )}** from <@${userId}>'s balance.\n` +
            `**New Balance:** $${formatNumberToReadableString(user.balance)}`,
          0x57f287,
          userId
        )
      } catch {
        return { success: false, message: 'Failed to send action message' }
      }
    }

    return { success: true, message: `Withdrew $${amount} from user.` }
  } catch (err) {
    console.error('Error withdrawing balance:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}

export async function resetBalance(
  userId: string,
  guildId: string,
  managerId: string
) {
  try {
    const user = await User.findOne({ userId, guildId })
    if (!user) return { success: false, message: 'User not registered.' }

    user.balance = 0
    await user.save()

    await Transaction.deleteMany({
      userId,
      guildId
    })

    const guildConfig = await GuildConfiguration.findOne({ guildId })
    const logChannelId = guildConfig?.atmChannelIds.logs
    const actionsChannelId = guildConfig?.atmChannelIds.actions
    if (logChannelId) {
      try {
        await sendEmbed(
          logChannelId,
          'ATM - Reset Balance via Web',
          `Manager <@${managerId}> reset the balance of <@${userId}>.`,
          0x1abc9c
        )
      } catch {
        return { success: false, message: 'Failed to send log message' }
      }
    }

    if (actionsChannelId) {
      try {
        await sendEmbed(
          actionsChannelId,
          'ATM - Reset Balance via Web',
          `An administrator has reset <@${userId}>'s balance and cleared transaction history.\n` +
            `**New Balance:** $0`,
          0x1abc9c,
          userId
        )
      } catch {
        return { success: false, message: 'Failed to send action message' }
      }
    }

    revalidatePath(`/dashboard/g/${guildId}/users`)
    return { success: true, message: 'User balance reset.' }
  } catch (err) {
    console.error('Error resetting balance:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}

export async function bonusBalance(
  userId: string,
  guildId: string,
  managerId: string,
  amount: number
) {
  try {
    const user = await User.findOne({ userId, guildId })
    if (!user) return { success: false, message: 'User not registered.' }

    user.balance += amount
    await user.save()

    await Transaction.create({
      userId,
      guildId,
      amount: amount,
      type: 'bonus',
      source: 'web',
      handledBy: managerId,
      createdAt: new Date()
    })

    const guildConfig = await GuildConfiguration.findOne({ guildId })
    const logChannelId = guildConfig?.atmChannelIds.logs
    if (logChannelId) {
      try {
        await sendEmbed(
          logChannelId,
          'ATM - Bonus Given via Web',
          `Manager <@${managerId}> successfully given **$${formatNumberToReadableString(
            amount
          )}** bonus to <@${userId}>.\nTheir new balance is now: **$${formatNumberToReadableString(
            user.balance
          )}**.`,
          0x57f287
        )

        // TODO: edit this
        // TODO: fix this
        // await sendEmbed(
        //   logChannelId,
        //   'ATM - Bonus Given via Web',
        //   `Manager <@${managerId}> successfully given **$${formatNumberToReadableString(
        //     amount
        //   )}** bonus to <@${userId}>.\nTheir new balance is now: **$${formatNumberToReadableString(
        //     user.balance
        //   )}**.`,
        //   0x57f287
        // )
      } catch {
        return { success: false, message: 'Failed to send log message' }
      }
    }

    return { success: true, message: `Bonus given $${amount} to user.` }
  } catch (err) {
    console.error('Error giving bonus:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}

export async function getUsers(
  guildId: string,
  session: Session | null,
  page = 1,
  limit = 15,
  search?: string,
  sort?: string
): Promise<{ users: TGuildMemberStatus[]; total: number }> {
  if (!session?.accessToken || page < 1 || limit < 1 || limit > 50) {
    return {
      users: [],
      total: 0
    }
  }

  await connectToDatabase()

  const dbUsers = (await User.find({ guildId })) as TUser[]
  const dbUsersMap = new Map(dbUsers.map((u) => [u.userId, u]))

  const discordMembers = await getDiscordGuildMembers(guildId)
  const discordMembersMap = new Map(discordMembers.map((m) => [m.userId, m]))

  const userIds = dbUsers.map((u) => u.userId)

  const transactions = await Transaction.find({
    guildId,
    userId: { $in: userIds }
  })

  const netProfitMap = new Map<string, number>()

  for (const tx of transactions) {
    const current = netProfitMap.get(tx.userId) ?? 0

    switch (tx.type) {
      case 'bet':
        netProfitMap.set(tx.userId, current - tx.amount)
        break
      case 'win':
      case 'bonus':
        netProfitMap.set(tx.userId, current + tx.amount)
        break
    }
  }

  let users: TGuildMemberStatus[] = Array.from(
    new Set<string>([
      ...dbUsers.map((u) => u.userId),
      ...discordMembers.map((m) => m.userId)
    ])
  ).map((userId) => {
    const dbUser = dbUsersMap.get(userId)
    const discordMember = discordMembersMap.get(userId)

    return {
      userId,
      username: discordMember?.username ?? 'Unknown',
      nickname: discordMember?.nickname ?? null,
      avatar: discordMember?.avatarUrl ?? '/default-avatar.jpg',
      registered: Boolean(dbUser),
      registeredAt: dbUser?.createdAt ?? null,
      balance: dbUser?.balance ?? 0,
      netProfit: netProfitMap.get(userId) ?? 0
    }
  })

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i')

    users = users.filter(
      (u) =>
        regex.test(u.userId) ||
        regex.test(u.username) ||
        (u.nickname !== null && regex.test(u.nickname))
    )
  }

  if (sort) {
    for (const part of sort.split(',').reverse()) {
      const [field, dir] = part.split(':')

      users.sort((a, b) => {
        const av = (a as Record<string, unknown>)[field]
        const bv = (b as Record<string, unknown>)[field]

        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1

        if (av < bv) return dir === 'asc' ? -1 : 1
        if (av > bv) return dir === 'asc' ? 1 : -1
        return 0
      })
    }
  }

  const total = users.length

  const start = (page - 1) * limit
  const end = start + limit

  return {
    users: users.slice(start, end),
    total
  }
}
