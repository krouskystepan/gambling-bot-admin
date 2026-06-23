'use client'

import { Download } from 'lucide-react'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { downloadCsvFile } from '@/lib/export/downloadCsv'

const ExportCsvButton = ({
  href,
  filename,
  label = 'Export CSV'
}: {
  href: string
  filename: string
  label?: string
}) => {
  const [isExporting, setIsExporting] = useState(false)

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isExporting}
      onClick={async () => {
        setIsExporting(true)
        try {
          await downloadCsvFile(href, filename)
        } finally {
          setIsExporting(false)
        }
      }}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}

export default ExportCsvButton
