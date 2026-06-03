import { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'

type ServerTablePageLayoutProps = {
  toolbar: ReactNode
  summary?: ReactNode
  pagination: ReactNode
  children: ReactNode
}

const ServerTablePageLayout = ({
  toolbar,
  summary,
  pagination,
  children
}: ServerTablePageLayoutProps) => {
  return (
    <div className="w-full space-y-6">
      {toolbar}
      {summary}
      <Card className="gap-0 overflow-hidden py-0">
        <CardContent className="p-0">{children}</CardContent>
      </Card>
      {pagination}
    </div>
  )
}

export default ServerTablePageLayout
