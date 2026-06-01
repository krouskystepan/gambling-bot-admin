import { Dice5 } from 'lucide-react'

import Link from 'next/link'

import { ThemeToggle } from '@/components/ThemeToggle'

type LandingShellProps = {
  children: React.ReactNode
}

const LandingShell = ({ children }: LandingShellProps) => {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--brand-muted),transparent_70%)] opacity-60 dark:opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,var(--brand)_0%,transparent_25%)] opacity-[0.07]"
      />

      <header className="relative z-10 flex items-center justify-between border-b border-border/60 px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Dice5 className="size-5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Casino Admin
          </span>
        </Link>

        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  )
}

export default LandingShell
