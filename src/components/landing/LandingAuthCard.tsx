'use client'

import { Dice5, Landmark, Settings, Users } from 'lucide-react'
import { Session } from 'next-auth'
import { signIn, signOut } from 'next-auth/react'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

const FEATURES = [
  { icon: Users, label: 'User & VIP management' },
  { icon: Landmark, label: 'Transaction history & filters' },
  { icon: Settings, label: 'Casino, bonus & channel settings' }
] as const

type LandingAuthCardProps = {
  session: Session | null
  callbackUrl?: string
}

const DiscordIcon = () => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    className="size-5 fill-current"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 12.3 12.3 0 0 0-.608 1.25 18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

const LandingAuthCard = ({
  session,
  callbackUrl = '/dashboard'
}: LandingAuthCardProps) => {
  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="grid md:grid-cols-5">
        <aside className="flex flex-col justify-between border-b border-border bg-muted/30 p-8 md:col-span-2 md:border-r md:border-b-0 md:p-10">
          <div>
            <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Dice5 className="size-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Casino Bot <span className="text-primary">Admin</span>
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Manage your Discord casino server - balances, games, VIP rooms,
              and settings from one dashboard.
            </p>
          </div>

          <ul className="mt-8 hidden space-y-3 md:block">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 text-sm text-muted-foreground"
              >
                <Icon className="size-4 shrink-0 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex flex-col items-center justify-center p-8 md:col-span-3 md:p-10">
          <div className="w-full max-w-sm text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {session ? 'Welcome back' : 'Sign in to continue'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {session
                ? 'Your Discord account is connected. Head to the dashboard to manage your servers.'
                : 'Use your Discord account to access servers where you have admin or manager permissions.'}
            </p>

            <div className="mt-6">
              {session ? (
                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" className="w-full">
                    <Link href={callbackUrl}>
                      <Dice5 className="size-4" />
                      Continue to Dashboard
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="discord"
                  size="lg"
                  className="h-12 w-full text-base font-semibold"
                  onClick={() => signIn('discord', { callbackUrl })}
                >
                  <DiscordIcon />
                  Continue with Discord
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingAuthCard
