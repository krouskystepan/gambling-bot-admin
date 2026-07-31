import { defaultPaySettings } from 'gambling-bot-shared/pay'

import { getPaySettings } from '@/actions/database/paySettings.action'
import FeatureLayout from '@/features/FeatureLayout'

import PaySettingsForm from './PaySettingsForm'

const PaySettingsPage = async ({ guildId }: { guildId: string }) => {
  const paySettings = await getPaySettings(guildId)

  return (
    <FeatureLayout
      title="Pay Settings"
      description="Fee and limits for peer transfers via /pay"
    >
      <PaySettingsForm
        guildId={guildId}
        savedSettings={{
          feePercent: paySettings?.feePercent ?? defaultPaySettings.feePercent,
          minAmount: paySettings?.minAmount ?? defaultPaySettings.minAmount,
          maxAmount: paySettings?.maxAmount ?? defaultPaySettings.maxAmount,
          maxDailyAmount:
            paySettings?.maxDailyAmount ?? defaultPaySettings.maxDailyAmount
        }}
      />
    </FeatureLayout>
  )
}

export default PaySettingsPage
