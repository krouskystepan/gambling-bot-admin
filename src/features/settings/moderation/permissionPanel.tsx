'use client'

import { Check, X } from 'lucide-react'

import ColoredBadge from '@/components/badges/ColoredBadge'
import { getManagerAccessBadgeClass } from '@/components/badges/badgeStyles'
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
          ? 'border-[#10B981]/25 bg-[#10B981]/5'
          : 'border-[#EF4444]/25 bg-[#EF4444]/5'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <ColoredBadge
          colorClass={getManagerAccessBadgeClass(
            isAllowed ? 'allowed' : 'denied'
          )}
          className="rounded-md py-0.5"
        >
          {isAllowed ? 'Allowed' : 'Not allowed'}
        </ColoredBadge>
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
                  ? 'text-[#10B981] dark:text-[#34D399]'
                  : 'text-[#EF4444]/80'
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
