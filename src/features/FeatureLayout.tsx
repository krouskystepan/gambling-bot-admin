import { ReactNode } from 'react'

const FeatureLayout = ({
  title,
  children
}: {
  title: string
  children: ReactNode
}) => {
  return (
    <section className="w-full">
      <h4 className="mb-4 text-3xl font-semibold text-yellow-400">{title}</h4>

      {children}
    </section>
  )
}

export default FeatureLayout
