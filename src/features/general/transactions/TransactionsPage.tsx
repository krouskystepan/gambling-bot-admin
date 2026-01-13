import { getServerSession } from 'next-auth'

import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'

import TransactionTable from './table/TransactionTable'
import { getTransactionsData } from './useTransactions'

function normalizeSearchParams(searchParams?: {
  page?: string
  limit?: string
  search?: string
  adminSearch?: string
  filterType?: string
  filterSource?: string
  dateFrom?: string
  dateTo?: string
  sort?: string
}) {
  return {
    page: Number(searchParams?.page ?? 1),
    limit: Number(searchParams?.limit ?? 10),
    search: searchParams?.search,
    adminSearch: searchParams?.adminSearch,
    filterType: searchParams?.filterType?.split(',').filter(Boolean),
    filterSource: searchParams?.filterSource?.split(',').filter(Boolean),
    dateFrom: searchParams?.dateFrom,
    dateTo: searchParams?.dateTo,
    sort: searchParams?.sort
  }
}

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

  const query = normalizeSearchParams(searchParams)

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
