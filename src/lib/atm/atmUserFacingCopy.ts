export const ATM_ACTIONS_DEPOSIT_TITLE = 'ATM - Deposit'
export const ATM_ACTIONS_WITHDRAW_TITLE = 'ATM - Withdrawal'

export const atmActionsDepositDescription = (
  amount: string,
  userId: string,
  balance: string
) =>
  `An administrator has added **${amount}** to <@${userId}>'s balance.\n` +
  `**New Balance:** ${balance}`

export const atmActionsWithdrawDescription = (
  amount: string,
  userId: string,
  balance: string
) =>
  `An administrator has removed **${amount}** from <@${userId}>'s balance.\n` +
  `**New Balance:** ${balance}`

export const atmApprovedDepositDescription = (amount: string) =>
  `Deposit of **${amount}** approved.`

export const atmApprovedWithdrawDescription = (amount: string) =>
  `Withdrawal of **${amount}** approved.`

export const atmRejectedDescription = (actionWord: string, amount: string) =>
  `${actionWord} of **${amount}** rejected.`
