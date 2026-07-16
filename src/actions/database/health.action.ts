'use server'

import { Session } from 'next-auth'

import { getUserPermissions } from '@/actions/perms'
import { type SetupHealthCheck } from '@/lib/overview/setupHealth'

import {
  getSetupHealthChecks,
  getSetupHealthIssueCount
} from './setupHealth.action'
import {
  type SystemHealthData,
  getSystemHealthAttentionCount,
  getSystemHealthData
} from './systemHealth.action'

export type HealthPageData = {
  operations: SystemHealthData
  setup: SetupHealthCheck[] | null
}

export const getHealthPageData = async (
  guildId: string,
  session: Session
): Promise<HealthPageData | null> => {
  const [operations, { isAdmin }] = await Promise.all([
    getSystemHealthData(guildId, session),
    getUserPermissions(guildId, session)
  ])

  if (!operations) return null

  const setup = isAdmin ? await getSetupHealthChecks(guildId) : null

  return { operations, setup }
}

export const getHealthAttentionCount = async (
  guildId: string,
  session: Session
): Promise<number> => {
  const [operationsCount, { isAdmin }] = await Promise.all([
    getSystemHealthAttentionCount(guildId, session),
    getUserPermissions(guildId, session)
  ])

  if (!isAdmin) return operationsCount

  const setupIssues = await getSetupHealthIssueCount(guildId)
  return operationsCount + setupIssues
}
