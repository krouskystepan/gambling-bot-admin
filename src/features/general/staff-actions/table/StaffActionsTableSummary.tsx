import type { StaffActionCounts } from '@/actions/database/staffActions.action'
import KpiStrip from '@/components/KpiStrip'

const StaffActionsTableSummary = ({
  counts
}: {
  counts: StaffActionCounts
}) => {
  return (
    <KpiStrip
      items={[
        { label: 'Balance', value: counts.balance },
        { label: 'ATM', value: counts.atm },
        { label: 'VIP', value: counts.vip },
        { label: 'Raffle', value: counts.raffle },
        { label: 'Prediction', value: counts.prediction }
      ]}
    />
  )
}

export default StaffActionsTableSummary
