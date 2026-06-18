import {
  STAFF_ADMIN_ACTIONS,
  type StaffAdminAction
} from 'gambling-bot-shared/transactions'

import Transaction from '@/models/Transaction'

type RecordStaffAuditInput = {
  guildId: string
  userId: string
  handledBy: string
  adminAction:
    | StaffAdminAction
    | (typeof STAFF_ADMIN_ACTIONS)[keyof typeof STAFF_ADMIN_ACTIONS]
  meta?: Record<string, unknown>
  notes?: string
}

export async function recordStaffAudit({
  guildId,
  userId,
  handledBy,
  adminAction,
  meta = {},
  notes
}: RecordStaffAuditInput) {
  await Transaction.create({
    userId,
    guildId,
    amount: 0,
    type: 'vip',
    source: 'web',
    handledBy,
    meta: {
      adminAction,
      ...meta,
      ...(notes ? { notes } : {})
    }
  })
}
