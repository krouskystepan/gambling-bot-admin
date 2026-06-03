import { formatNumberToReadableString, TTransaction } from 'gambling-bot-shared'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  sourceBadgeMap,
  typeBadgeMap
} from '@/features/general/transactions/table/transactionBadges'
import { TTransactionDiscord } from '@/types/types'

type OverviewRecentTransactionsProps = {
  guildId: string
  transactions: TTransactionDiscord[]
  dateFrom: string
  dateTo: string
}

const OverviewRecentTransactions = ({
  guildId,
  transactions,
  dateFrom,
  dateTo
}: OverviewRecentTransactionsProps) => {
  const transactionsHref = `/dashboard/g/${guildId}/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Recent transactions</CardTitle>
          <CardDescription>Latest activity in the selected period</CardDescription>
        </div>
        <Link
          href={transactionsHref}
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions in this period.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((tx) => {
              const type = tx.type as TTransaction['type']
              const source = tx.source as TTransaction['source']

              return (
                <li
                  key={tx.id}
                  className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Image
                    src={tx.avatar}
                    alt={tx.username}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tx.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.createdAt), 'MMM d, HH:mm')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${typeBadgeMap[type]} px-2`}>
                      {type.toUpperCase()}
                    </Badge>
                    <Badge className={`${sourceBadgeMap[source]} px-2`}>
                      {source.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="font-semibold tabular-nums">
                    ${formatNumberToReadableString(tx.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default OverviewRecentTransactions
