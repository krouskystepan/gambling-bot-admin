import { TableCell, TableFooter, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { TGuildMemberStatus } from '@/types/types'

const UserTableFooter = ({
  totalBalanceStr,
  totalNetProfit,
  totalProfitStr,
  data
}: {
  totalBalanceStr: string
  totalNetProfit: number
  totalProfitStr: string
  data: TGuildMemberStatus[]
}) => {
  return (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={3} className="font-medium">
          Overall Stats
        </TableCell>
        <TableCell className="text-left font-medium">
          {totalBalanceStr}
        </TableCell>
        <TableCell
          className={cn(
            'text-left font-medium',
            totalNetProfit > 0
              ? 'text-green-500'
              : totalNetProfit < 0
                ? 'text-red-500'
                : 'text-white'
          )}
        >
          {totalProfitStr}
        </TableCell>
        <TableCell />
        <TableCell>
          <span className="ml-1">{`${
            data.filter((u) => u.registered).length
          }/${data.length}`}</span>
        </TableCell>
        <TableCell />
      </TableRow>
    </TableFooter>
  )
}

export default UserTableFooter
