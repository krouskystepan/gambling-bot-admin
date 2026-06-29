import {
  STAFF_ADMIN_ACTIONS,
  type StaffActionCategory
} from 'gambling-bot-shared/transactions'

export function resolveStaffActionLabel(input: {
  type?: string
  source?: string
  meta?: Record<string, unknown> | null
  sourceType?: 'transaction' | 'atmRequest'
}): {
  label: string
  category: StaffActionCategory
  badge: string
  sublabel: string | null
} {
  const adminAction = input.meta?.adminAction as string | undefined
  const requestId = input.meta?.requestId

  if (
    adminAction === STAFF_ADMIN_ACTIONS.ATM_REJECT ||
    input.sourceType === 'atmRequest'
  ) {
    return {
      label: 'ATM rejected',
      category: 'atm',
      badge: 'REJECT',
      sublabel: null
    }
  }

  if (adminAction === STAFF_ADMIN_ACTIONS.RAFFLE_CANCEL) {
    return {
      label: 'Raffle canceled',
      category: 'raffle',
      badge: 'RAFFLE',
      sublabel: 'Canceled'
    }
  }

  if (adminAction === STAFF_ADMIN_ACTIONS.PREDICTION_END) {
    return {
      label: 'Prediction ended',
      category: 'prediction',
      badge: 'PREDICT',
      sublabel: 'Ended'
    }
  }

  if (adminAction === STAFF_ADMIN_ACTIONS.PREDICTION_PAYOUT) {
    return {
      label: 'Prediction paid out',
      category: 'prediction',
      badge: 'PREDICT',
      sublabel: 'Paid out'
    }
  }

  if (adminAction === STAFF_ADMIN_ACTIONS.PREDICTION_CANCEL) {
    return {
      label: 'Prediction canceled',
      category: 'prediction',
      badge: 'PREDICT',
      sublabel: 'Canceled'
    }
  }

  if (input.type === 'vip') {
    const vipLabels: Record<string, string> = {
      [STAFF_ADMIN_ACTIONS.VIP_BUY]: 'Created',
      [STAFF_ADMIN_ACTIONS.VIP_EXTEND]: 'Extended',
      [STAFF_ADMIN_ACTIONS.VIP_ADD_MEMBER]: 'Member added',
      [STAFF_ADMIN_ACTIONS.VIP_REMOVE]: 'Removed'
    }

    const sublabel = adminAction
      ? (vipLabels[adminAction] ?? 'Action')
      : 'Action'

    return {
      label: `VIP ${sublabel.toLowerCase()}`,
      category: 'vip',
      badge: 'VIP',
      sublabel
    }
  }

  if (requestId && (input.type === 'deposit' || input.type === 'withdraw')) {
    return {
      label: `ATM ${input.type} approved`,
      category: 'atm',
      badge: input.type === 'deposit' ? 'DEPOSIT' : 'WITHDRAW',
      sublabel: 'ATM approved'
    }
  }

  if (adminAction === STAFF_ADMIN_ACTIONS.USER_BAN) {
    return {
      label: 'Player banned',
      category: 'user',
      badge: 'BAN',
      sublabel: null
    }
  }

  if (adminAction === STAFF_ADMIN_ACTIONS.USER_UNBAN) {
    return {
      label: 'Player unbanned',
      category: 'user',
      badge: 'UNBAN',
      sublabel: null
    }
  }

  if (adminAction === STAFF_ADMIN_ACTIONS.USER_NOTE) {
    return {
      label: 'Staff note added',
      category: 'user',
      badge: 'NOTE',
      sublabel: null
    }
  }

  if (input.type === 'deposit') {
    return {
      label: 'Deposit',
      category: 'balance',
      badge: 'DEPOSIT',
      sublabel: null
    }
  }

  if (input.type === 'withdraw') {
    return {
      label: 'Withdrawal',
      category: 'balance',
      badge: 'WITHDRAW',
      sublabel: null
    }
  }

  if (input.type === 'bonus') {
    return {
      label: 'Bonus',
      category: 'balance',
      badge: 'BONUS',
      sublabel: null
    }
  }

  return {
    label: adminAction ?? input.type ?? 'Staff action',
    category: 'balance',
    badge: 'ACTION',
    sublabel: null
  }
}

export function resolveStaffActionDetailHref(
  guildId: string,
  input: {
    type?: string
    meta?: Record<string, unknown> | null
    sourceType?: 'transaction' | 'atmRequest'
    referenceId?: string
    subjectUserId?: string
  }
): string | undefined {
  const requestId =
    input.referenceId ?? (input.meta?.requestId as string | undefined)
  const drawId = input.meta?.drawId as string | undefined
  const predictionId = input.meta?.predictionId as string | undefined
  const adminAction = input.meta?.adminAction as string | undefined

  if (
    input.subjectUserId &&
    (adminAction === STAFF_ADMIN_ACTIONS.USER_BAN ||
      adminAction === STAFF_ADMIN_ACTIONS.USER_UNBAN ||
      adminAction === STAFF_ADMIN_ACTIONS.USER_NOTE)
  ) {
    return `/dashboard/g/${guildId}/users/${input.subjectUserId}`
  }

  if (
    requestId &&
    (adminAction === STAFF_ADMIN_ACTIONS.ATM_REJECT ||
      input.type === 'deposit' ||
      input.type === 'withdraw' ||
      input.sourceType === 'atmRequest')
  ) {
    return `/dashboard/g/${guildId}/transactions?referenceId=${requestId}`
  }

  if (drawId) {
    return `/dashboard/g/${guildId}/raffles?search=${drawId}`
  }

  if (predictionId) {
    return `/dashboard/g/${guildId}/predictions?search=${predictionId}`
  }

  return undefined
}
