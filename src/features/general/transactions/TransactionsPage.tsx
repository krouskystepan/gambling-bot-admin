import { getServerSession } from 'next-auth'

import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'

import TransactionTable from './table/TransactionTable'
import {
  getTransactionsData,
  normalizeTransactionsSearchParams
} from './useTransactions'

const TransactionsPage = async ({
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

  const query = normalizeTransactionsSearchParams(searchParams)

  const { transactions, transactionCounts, total, gamePnL, cashFlow } =
    await getTransactionsData(guildId, session, query)

  return (
    <FeatureLayout title={'Transactions'}>
      <TransactionTable
        transactions={transactions}
        transactionCounts={transactionCounts}
        guildId={guildId}
        managerId={session.userId!}
        page={query.page}
        limit={query.limit}
        total={total}
        gamePnL={gamePnL}
        cashFlow={cashFlow}
      />
    </FeatureLayout>
  )
}

export default TransactionsPage
