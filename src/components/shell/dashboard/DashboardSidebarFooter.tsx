'use client'

import { LogOut, Moon, Settings2, Sun } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'

import { useState, useSyncExternalStore } from 'react'

import Image from 'next/image'

import ProfilePreferencesDialog from '@/components/shell/dashboard/ProfilePreferencesDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import {
  persistProfilePreferences,
  useProfilePreferences
} from '@/lib/preferences/profilePreferences'

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
  const { preferences, persist } = useProfilePreferences()
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const displayName = userName ?? 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isDark = resolvedTheme === 'dark'
  const compactTables = preferences.tableDensity === 'compact'

  const handleQuickThemeToggle = () => {
    const nextTheme = isDark ? 'light' : 'dark'
    persistProfilePreferences({ theme: nextTheme })
    setTheme(nextTheme)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={displayName}
            className="m-0 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-0 bg-muted p-0 outline-none cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:ring-2 data-[state=open]:ring-ring"
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
          className="w-56"
        >
          <DropdownMenuLabel className="font-medium text-foreground">
            {displayName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] font-semibold tracking-wider uppercase">
            Quick settings
          </DropdownMenuLabel>
          <DropdownMenuItem
            disabled={!isClient}
            onSelect={(event) => event.preventDefault()}
            onClick={handleQuickThemeToggle}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!isClient}
            className="justify-between gap-3"
            onSelect={(event) => event.preventDefault()}
            onClick={() =>
              persist({
                tableDensity: compactTables ? 'comfortable' : 'compact'
              })
            }
          >
            <span>Compact tables</span>
            <Switch
              checked={compactTables}
              disabled={!isClient}
              tabIndex={-1}
              onCheckedChange={(checked) =>
                persist({ tableDensity: checked ? 'compact' : 'comfortable' })
              }
              onClick={(event) => event.stopPropagation()}
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!isClient}
            onSelect={() => setPreferencesOpen(true)}
          >
            <Settings2 className="size-4" />
            Preferences
          </DropdownMenuItem>
          {/* TODO: notification settings */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfilePreferencesDialog
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </>
  )
}

export default DashboardSidebarFooter
