'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { useSyncExternalStore } from 'react'

import Image from 'next/image'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

type DashboardSidebarFooterProps = {
  userName: string | null
  userImage: string | null
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

const DashboardSidebarFooter = ({
  userName,
  userImage
}: DashboardSidebarFooterProps) => {
  const { resolvedTheme, setTheme } = useTheme()
  const isClient = useIsClient()
  const displayName = userName ?? 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isDark = resolvedTheme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={displayName}
          className="m-0 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-0 bg-muted p-0 outline-none cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${displayName} settings`}
        >
          {userImage ? (
            <Image
              src={userImage}
              alt={displayName}
              className="size-10 rounded-full object-cover"
              height={40}
              width={40}
            />
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {initials}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-52"
      >
        <DropdownMenuLabel className="font-medium text-foreground">
          {displayName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-semibold tracking-wider uppercase">
          User settings
        </DropdownMenuLabel>
        <DropdownMenuItem
          disabled={!isClient}
          onSelect={(event) => event.preventDefault()}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        {/* TODO: profile preferences */}
        {/* TODO: notification settings */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DashboardSidebarFooter
