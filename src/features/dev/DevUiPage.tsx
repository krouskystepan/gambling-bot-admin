import FeatureLayout from '@/features/FeatureLayout'

import BadgeShowcase from './components/BadgeShowcase'
import DevSectionHeading from './components/DevSectionHeading'
import StateShowcase from './components/StateShowcase'
import UiShowcase from './components/UiShowcase'
import { requireDevPage } from './requireDevPage'

const DevUiPage = async ({ guildId }: { guildId: string }) => {
  await requireDevPage(guildId)

  return (
    <FeatureLayout title="UI kit">
      <div className="space-y-10">
        <section className="space-y-4">
          <DevSectionHeading
            title="Badges"
            description="Colored and semantic badges used across the admin panel."
          />
          <BadgeShowcase />
        </section>

        <section className="space-y-4">
          <DevSectionHeading
            title="Buttons"
            description="Button variants, sizes, and states used in forms and tables."
          />
          <UiShowcase />
        </section>

        <section className="space-y-4">
          <DevSectionHeading
            title="States"
            description="Full-page states rendered at a compact preview size."
          />
          <StateShowcase />
        </section>
      </div>
    </FeatureLayout>
  )
}

export default DevUiPage
