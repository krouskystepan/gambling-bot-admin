'use client'

import { Check, Copy } from 'lucide-react'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CopyableCodeProps = {
  value: string
  className?: string
}

const CopyableCode = ({ value, className }: CopyableCodeProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={cn('flex w-full items-center gap-2', className)}>
      <code className="flex min-h-7 min-w-0 flex-1 items-center rounded-md bg-muted px-2.5 py-1 text-xs break-all">
        {value}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7 shrink-0"
        onClick={handleCopy}
        aria-label={`Copy ${value}`}
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  )
}

export default CopyableCode
