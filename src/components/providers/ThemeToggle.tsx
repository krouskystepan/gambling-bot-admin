'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeToggleProps = {
  className?: string
  variant?: 'ghost' | 'outline'
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export function ThemeToggle({
  className,
  variant = 'outline'
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isClient = useIsClient()

  if (!isClient) {
    return (
      <Button
        variant={variant}
        size="icon"
        className={cn('size-9 shrink-0', className)}
        aria-label="Toggle theme"
        disabled
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn('size-9 shrink-0', className)}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
