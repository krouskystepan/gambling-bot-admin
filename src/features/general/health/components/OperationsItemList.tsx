import { ExternalLink, User } from 'lucide-react'

import Link from 'next/link'

import type { SystemHealthItem } from '@/actions/database/systemHealth.action'
import { formatAgeMs } from '@/lib/systemHealth/formatAge'

export type OperationsItemListProps = {
  items: SystemHealthItem[]
}

const OperationsItemList = ({ items }: OperationsItemListProps) => {
  return (
    <div className="border-t border-border pt-4">
      <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Details
      </h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.title}-${item.ageMs}-${index}`}
            className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm leading-snug"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground">{item.title}</div>
              <div className="text-muted-foreground">{item.subtitle}</div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {item.adminHref ? (
                <Link
                  href={item.adminHref}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Open user profile"
                >
                  <User size={14} />
                </Link>
              ) : null}
              {item.discordHref ? (
                <a
                  href={item.discordHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Open in Discord"
                >
                  <ExternalLink size={14} />
                </a>
              ) : null}
              <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">
                {formatAgeMs(item.ageMs)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default OperationsItemList
