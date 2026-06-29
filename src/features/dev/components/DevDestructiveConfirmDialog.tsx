'use client'

import { AlertTriangle } from 'lucide-react'

import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type DevDestructiveConfirmItem = {
  label: string
  count?: number
  detail?: string
}

type DevDestructiveConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  guildId: string
  title: string
  description: string
  items: DevDestructiveConfirmItem[]
  confirmLabel: string
  pending?: boolean
  onConfirm: (confirmationPhrase: string) => void | Promise<void>
}

const DevDestructiveConfirmDialog = ({
  open,
  onOpenChange,
  guildId,
  title,
  description,
  items,
  confirmLabel,
  pending = false,
  onConfirm
}: DevDestructiveConfirmDialogProps) => {
  const [phrase, setPhrase] = useState('')

  const phraseMatches = phrase.trim() === guildId

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPhrase('')
    }

    onOpenChange(nextOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-foreground">This will affect:</p>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <span>{item.label}</span>
                  {typeof item.count === 'number' ? (
                    <span className="tabular-nums text-muted-foreground">
                      {item.count.toLocaleString()}
                    </span>
                  ) : null}
                </div>
                {item.detail ? (
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dev-destructive-confirm">
            Type guild ID <span className="font-mono">{guildId}</span> to
            confirm
          </Label>
          <Input
            id="dev-destructive-confirm"
            value={phrase}
            onChange={(event) => setPhrase(event.target.value)}
            placeholder={guildId}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!phraseMatches || pending}
            onClick={() => onConfirm(phrase.trim())}
          >
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DevDestructiveConfirmDialog
