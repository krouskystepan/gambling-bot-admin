import Link from 'next/link'

import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'
import { guildBasePath } from '@/lib/guild/guildBasePath'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'

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
    staffId?: string
    referenceId?: string
    betId?: string
    adminSearch?: string
    filterType?: string
    filterSource?: string
    filterCasinoGame?: string
    dateFrom?: string
    dateTo?: string
    sort?: string
  }
}) => {
  const session = await requireSession()

  const query = normalizeTransactionsSearchParams(searchParams)

  const [
    {
      transactions,
      transactionCounts,
      total,
      gamePnL,
      cashFlow,
      staffMembers,
      guildMembers
    },
    globalSettings
  ] = await Promise.all([
    getTransactionsData(guildId, session, query),
    getGuildGlobalSettings(guildId)
  ])

  return (
    <FeatureLayout
      title="Transactions"
      description="Full money movement log across games and staff"
      actions={
        <Link
          href={`${guildBasePath(guildId)}/staff-actions`}
          className="text-sm text-primary hover:underline"
        >
          View staff actions only →
        </Link>
      }
    >
      <TransactionTable
        guildId={guildId}
        globalSettings={globalSettings}
        transactions={transactions}
        transactionCounts={transactionCounts}
        staffMembers={staffMembers}
        guildMembers={guildMembers}
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
