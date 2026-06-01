import { ReactNode } from 'react'

import { PageHeader } from '@/components/PageHeader'

const FeatureLayout = ({
  title,
  children
}: {
  title: string
  children: ReactNode
}) => {
  return (
    <section className="w-full">
      <PageHeader title={title} size="page" />

      {children}
    </section>
  )
}

export default FeatureLayout
