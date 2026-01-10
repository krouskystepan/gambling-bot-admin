import { getServerSession } from 'next-auth'

import {
  getTransactionCounts,
  getTransactions
} from '@/actions/database/transaction.action'
import { authOptions } from '@/lib/authOptions'

import TransactionTable from '../tables/transactions/TransactionTable'

const TransactionsSection = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    page?: string
    limit?: string
    search?: string
    adminSearch?: string
    filterType?: string
    filterSource?: string
    dateFrom?: string
    dateTo?: string
    sort?: string
  }
}) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const page = Number(searchParams?.page ?? 1)
  const limit = Number(searchParams?.limit ?? 10)

  const filterType = searchParams?.filterType?.split(',').filter(Boolean)
  const filterSource = searchParams?.filterSource?.split(',').filter(Boolean)

  const { transactions, total, gamePnL, cashFlow } = await getTransactions(
    guildId,
    session,
    page,
    limit,
    searchParams?.search || undefined,
    searchParams?.adminSearch || undefined,
    filterType?.length ? filterType : undefined,
    filterSource?.length ? filterSource : undefined,
    searchParams?.dateFrom || undefined,
    searchParams?.dateTo || undefined,
    searchParams?.sort || undefined
  )

  const transactionCounts = await getTransactionCounts(
    guildId,
    session,
    filterType?.length ? filterType : undefined,
    filterSource?.length ? filterSource : undefined,
    searchParams?.search || undefined,
    searchParams?.adminSearch || undefined,
    searchParams?.dateFrom || undefined,
    searchParams?.dateTo || undefined
  )

  return (
    <TransactionTable
      transactions={transactions}
      transactionCounts={transactionCounts}
      guildId={guildId}
      managerId={session.userId!}
      page={page}
      limit={limit}
      total={total}
      gamePnL={gamePnL}
      cashFlow={cashFlow}
    />
  )
}

export default TransactionsSection
