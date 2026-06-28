'use client'

import { Check, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type PermissionItem = { id: string; label: string }

type PermissionBoxProps = {
  variant: 'allowed' | 'denied'
  items: readonly PermissionItem[]
}

export function PermissionBox({ variant, items }: PermissionBoxProps) {
  const isAllowed = variant === 'allowed'
  const Icon = isAllowed ? Check : X

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col rounded-lg border p-3',
        isAllowed
          ? 'border-emerald-500/25 bg-emerald-500/5'
          : 'border-destructive/25 bg-destructive/5'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            'rounded-md px-2 py-0.5 text-xs font-medium',
            isAllowed
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          )}
        >
          {isAllowed ? 'Allowed' : 'Not allowed'}
        </Badge>
      </div>
      <ul className="space-y-2.5">
        {items.map(({ id, label }) => (
          <li
            key={id}
            className="flex items-start gap-2.5 text-sm leading-snug"
          >
            <Icon
              className={cn(
                'mt-0.5 size-4 shrink-0',
                isAllowed
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-destructive/80'
              )}
              aria-hidden
            />
            <span className={cn(!isAllowed && 'text-muted-foreground')}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PermissionTabPanel({
  allowed,
  denied
}: {
  allowed: readonly PermissionItem[]
  denied: readonly PermissionItem[]
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PermissionBox variant="allowed" items={allowed} />
      <PermissionBox variant="denied" items={denied} />
    </div>
  )
}
