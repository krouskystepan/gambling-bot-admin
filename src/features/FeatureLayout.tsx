import { ReactNode } from 'react'

import { PageHeader } from '@/components/page/PageHeader'
import { cn } from '@/lib/utils'

const FeatureLayout = ({
  title,
  description,
  actions,
  children
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) => {
  return (
    <section className="w-full">
      {actions ? (
        <div
          className={cn(
            'mb-4 flex flex-wrap justify-between gap-4',
            description ? 'items-start' : 'items-center'
          )}
        >
          <PageHeader
            title={title}
            description={description}
            size="page"
            className="mb-0"
          />
          <div className="flex shrink-0 items-center gap-4">{actions}</div>
        </div>
      ) : (
        <PageHeader title={title} description={description} size="page" />
      )}

      {children}
    </section>
  )
}

export default FeatureLayout
