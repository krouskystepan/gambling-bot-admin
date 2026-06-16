'use client'

import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'

const ExportCsvButton = ({
  href,
  label = 'Export CSV'
}: {
  href: string
  label?: string
}) => {
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={href} download>
        <Download className="mr-2 h-4 w-4" />
        {label}
      </a>
    </Button>
  )
}

export default ExportCsvButton
