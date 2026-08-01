'use server'

import { generateId } from 'gambling-bot-shared/common'
import {
  DEFAULT_QUEST_TEMPLATES,
  type QuestKind,
  type TQuest,
  createQuestFormSchema,
  updateQuestFormSchema
} from 'gambling-bot-shared/quests'
import { Session } from 'next-auth'
import { z } from 'zod'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/db'
import {
  blockPanelFeatureAction,
  blockPanelMaintenanceAction
} from '@/lib/panel/panelFeatureActionGuard.server'
import { getPanelFeatureBlockMessage } from '@/lib/panel/panelGlobalFeatureGuard'
import {
  assertNotDemoMutation,
  getDemoQuestPageContext,
  getDemoQuests,
  isDemoGuild
} from '@/lib/presentation'
import { recordSettingsChange } from '@/lib/settingsAudit/recordSettingsChange'
import { escapeRegExp } from '@/lib/utils'
import GuildConfiguration from '@/models/GuildConfiguration'
import Quest from '@/models/Quest'

import { requireGuildAccess } from '../perms'

type ActionResult = { success: boolean; message: string; rateLimited?: boolean }

export type QuestPageContext = {
  questFeatureBlocked: boolean
  questFeatureBlockMessage: string | null
}

function questsPath(guildId: string) {
  return `/dashboard/g/${guildId}/quests`
}

function handleActionError(err: unknown): ActionResult {
  console.error('Quest action failed:', err)
  return { success: false, message: 'Server error, please try again.' }
}

/** Strip Mongo `_id` / `__v` so props are RSC-safe for client components. */
function toQuestProps(quest: TQuest): TQuest {
  return {
    questId: quest.questId,
    guildId: quest.guildId,
    name: quest.name,
    description: quest.description,
    kind: quest.kind,
    condition: {
      type: quest.condition.type,
      threshold: quest.condition.threshold,
      ...(quest.condition.game ? { game: quest.condition.game } : {})
    },
    rewardAmount: quest.rewardAmount,
    enabled: quest.enabled,
    sortOrder: quest.sortOrder,
    createdAt: quest.createdAt,
    updatedAt: quest.updatedAt
  }
}

/** Stable audit snapshot (no timestamps / guild id noise). */
function toQuestAuditSnapshot(quest: {
  questId: string
  name: string
  description: string
  kind: QuestKind
  condition: TQuest['condition']
  rewardAmount: number
  enabled: boolean
  sortOrder: number
}) {
  return {
    questId: quest.questId,
    name: quest.name,
    description: quest.description,
    kind: quest.kind,
    condition: {
      type: quest.condition.type,
      threshold: quest.condition.threshold,
      ...(quest.condition.game ? { game: quest.condition.game } : {})
    },
    rewardAmount: quest.rewardAmount,
    enabled: quest.enabled,
    sortOrder: quest.sortOrder
  }
}

/** Key by questId so rapid quest edits can coalesce in the audit window. */
function toQuestAuditMap(
  quest: Parameters<typeof toQuestAuditSnapshot>[0]
): Record<string, ReturnType<typeof toQuestAuditSnapshot>> {
  return { [quest.questId]: toQuestAuditSnapshot(quest) }
}

const createQuestInputSchema = createQuestFormSchema
const updateQuestInputSchema = updateQuestFormSchema

export async function getQuestPageContext(
  guildId: string
): Promise<QuestPageContext | null> {
  if (isDemoGuild(guildId)) return getDemoQuestPageContext()

  const access = await requireGuildAccess(guildId)
  if ('error' in access) return null

  await connectToDatabase()

  const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()

  const questFeatureBlockMessage = getPanelFeatureBlockMessage(
    guildConfig?.globalSettings,
    'quests',
    access.isAdmin
  )

  return {
    questFeatureBlocked: questFeatureBlockMessage !== null,
    questFeatureBlockMessage
  }
}

export async function getQuests(
  guildId: string,
  _session: Session,
  page = 1,
  limit = 10,
  search?: string,
  sort?: string,
  kind: QuestKind | 'all' = 'all'
): Promise<{ quests: TQuest[]; total: number }> {
  if (isDemoGuild(guildId)) {
    return getDemoQuests({ page, limit, search, kind })
  }

  const access = await requireGuildAccess(guildId)
  if ('error' in access || page < 1 || limit < 1 || limit > 50) {
    return { quests: [], total: 0 }
  }

  await connectToDatabase()

  const query: { guildId: string; kind?: QuestKind } = { guildId }
  if (kind !== 'all') {
    query.kind = kind
  }

  const docs = await Quest.find(query).lean<TQuest[]>()
  if (!docs.length) return { quests: [], total: 0 }

  let quests = [...docs]

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i')
    quests = quests.filter(
      (quest) =>
        regex.test(quest.name) ||
        regex.test(quest.description) ||
        regex.test(quest.questId)
    )
  }

  if (sort) {
    for (const part of sort.split(',').reverse()) {
      const [field, dir] = part.split(':')

      quests.sort((a, b) => {
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
  } else {
    quests.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'daily' ? -1 : 1
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return a.name.localeCompare(b.name)
    })
  }

  const total = quests.length
  const start = (page - 1) * limit

  return {
    quests: quests.slice(start, start + limit).map(toQuestProps),
    total
  }
}

export async function createQuest(
  guildId: string,
  values: z.infer<typeof createQuestFormSchema>
): Promise<ActionResult> {
  assertNotDemoMutation(guildId)

  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(guildId, 'quests', access)
  if (blocked) return blocked

  const parsed = createQuestInputSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, message: 'Invalid quest form data.' }
  }

  try {
    await connectToDatabase()

    const existing = await Quest.findOne({
      guildId,
      name: parsed.data.name
    }).lean()
    if (existing) {
      return {
        success: false,
        message: 'A quest with this name already exists for this server.'
      }
    }

    const questId = generateId('quest')
    const created = await Quest.create({
      questId,
      guildId,
      ...parsed.data
    })

    await recordSettingsChange({
      guildId,
      changedBy: access.session.userId!,
      section: 'quests',
      before: {},
      after: toQuestAuditMap(created)
    })

    revalidatePath(questsPath(guildId))
    return { success: true, message: 'Quest created.' }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function updateQuest(
  guildId: string,
  values: z.infer<typeof updateQuestFormSchema>
): Promise<ActionResult> {
  assertNotDemoMutation(guildId)

  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(guildId, 'quests', access)
  if (blocked) return blocked

  const parsed = updateQuestInputSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, message: 'Invalid quest form data.' }
  }

  try {
    await connectToDatabase()

    const existing = await Quest.findOne({
      guildId,
      questId: parsed.data.questId
    }).lean<TQuest | null>()
    if (!existing) {
      return { success: false, message: 'Quest not found.' }
    }

    const duplicate = await Quest.findOne({
      guildId,
      name: parsed.data.name,
      questId: { $ne: parsed.data.questId }
    }).lean()
    if (duplicate) {
      return {
        success: false,
        message: 'Another quest with this name already exists.'
      }
    }

    const updated = await Quest.findOneAndUpdate(
      { guildId, questId: parsed.data.questId },
      {
        $set: {
          name: parsed.data.name,
          description: parsed.data.description,
          kind: parsed.data.kind,
          condition: parsed.data.condition,
          rewardAmount: parsed.data.rewardAmount,
          enabled: parsed.data.enabled,
          sortOrder: parsed.data.sortOrder
        }
      },
      { new: true }
    ).lean<TQuest | null>()

    if (!updated) {
      return { success: false, message: 'Quest not found.' }
    }

    await recordSettingsChange({
      guildId,
      changedBy: access.session.userId!,
      section: 'quests',
      before: toQuestAuditMap(existing),
      after: toQuestAuditMap(updated)
    })

    revalidatePath(questsPath(guildId))
    return { success: true, message: 'Quest updated.' }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function toggleQuestEnabled(
  guildId: string,
  questId: string,
  enabled: boolean
): Promise<ActionResult> {
  assertNotDemoMutation(guildId)

  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(guildId, 'quests', access)
  if (blocked) return blocked

  try {
    await connectToDatabase()

    const existing = await Quest.findOne({
      guildId,
      questId
    }).lean<TQuest | null>()
    if (!existing) {
      return { success: false, message: 'Quest not found.' }
    }

    const updated = await Quest.findOneAndUpdate(
      { guildId, questId },
      { $set: { enabled } },
      { new: true }
    ).lean<TQuest | null>()

    if (!updated) {
      return { success: false, message: 'Quest not found.' }
    }

    await recordSettingsChange({
      guildId,
      changedBy: access.session.userId!,
      section: 'quests',
      before: toQuestAuditMap(existing),
      after: toQuestAuditMap(updated)
    })

    revalidatePath(questsPath(guildId))
    return {
      success: true,
      message: enabled ? 'Quest enabled.' : 'Quest disabled.'
    }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function seedDefaultQuests(
  guildId: string
): Promise<ActionResult> {
  assertNotDemoMutation(guildId)

  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(guildId, 'quests', access)
  if (blocked) return blocked

  try {
    await connectToDatabase()

    const existing = await Quest.find({ guildId })
      .select('name')
      .lean<Pick<TQuest, 'name'>[]>()
    const existingNames = new Set(existing.map((quest) => quest.name))

    const toInsert = DEFAULT_QUEST_TEMPLATES.filter(
      (template) => !existingNames.has(template.name)
    ).map((template) => ({
      questId: generateId('quest'),
      guildId,
      name: template.name,
      description: template.description,
      kind: template.kind,
      condition: template.condition,
      rewardAmount: template.rewardAmount,
      enabled: true,
      sortOrder: template.sortOrder
    }))

    if (!toInsert.length) {
      return {
        success: true,
        message: 'All default quests are already present.'
      }
    }

    await Quest.insertMany(toInsert)

    await recordSettingsChange({
      guildId,
      changedBy: access.session.userId!,
      section: 'quests',
      before: {},
      after: Object.fromEntries(
        toInsert.map((quest) => [quest.questId, toQuestAuditSnapshot(quest)])
      )
    })

    revalidatePath(questsPath(guildId))
    return {
      success: true,
      message: `Added ${toInsert.length} default quest${toInsert.length === 1 ? '' : 's'}.`
    }
  } catch (err) {
    return handleActionError(err)
  }
}
