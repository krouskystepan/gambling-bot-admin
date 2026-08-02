import { Ban } from 'lucide-react'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { guildBasePath } from '@/lib/guild/guildBasePath'

type BanLogLinkProps = {
  guildId: string
  userId: string
  banCount: number
  banned: boolean
}

const BanLogLink = ({ guildId, userId, banCount, banned }: BanLogLinkProps) => {
  const count = banCount || (banned ? 1 : 0)

  const countLabel =
    count === 0
      ? 'No ban records'
      : count === 1
        ? '1 ban record'
        : `${count} ban records`

  const href = `${guildBasePath(guildId)}/bans?userId=${encodeURIComponent(userId)}&status=all`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative size-9 shrink-0"
          aria-label={countLabel}
          asChild
        >
          <Link href={href}>
            <Ban className="size-4" />
            {count > 0 ? (
              <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Ban log</TooltipContent>
    </Tooltip>
  )
}

export default BanLogLink
