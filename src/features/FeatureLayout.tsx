import { ReactNode } from 'react'

import { PageHeader } from '@/components/page/PageHeader'

const FeatureLayout = ({
  title,
  actions,
  children
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
}) => {
  return (
    <section className="w-full">
      {actions ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <PageHeader title={title} size="page" className="mb-0" />
          <div className="flex shrink-0 items-center gap-4">{actions}</div>
        </div>
      ) : (
        <PageHeader title={title} size="page" />
      )}

      {children}
    </section>
  )
}

export default FeatureLayout
