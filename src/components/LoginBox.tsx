'use client'

import { motion } from 'framer-motion'
import { Dice5 } from 'lucide-react'
import { Session } from 'next-auth'
import { signIn, signOut } from 'next-auth/react'

import Link from 'next/link'

import { Button } from './ui/button'

const LoginBox = ({ session }: { session: Session | null }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-10 w-[92%] max-w-lg"
    >
      <div className="group relative rounded-2xl bg-linear-to-br from-yellow-500/50 via-yellow-300/20 to-transparent p-px shadow-[0_0_40px_rgba(255,215,0,0.12)]">
        <div className="relative rounded-2xl border border-yellow-500/20 bg-black/60 p-6 shadow-lg">
          <div className="mb-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="animate-gradient-x mb-0 bg-linear-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-size-[200%_200%] bg-clip-text text-4xl font-extrabold text-transparent">
                {session ? 'Welcome Back!' : 'Welcome'}
              </h1>
            </div>

            <p className="text-center text-base text-gray-300">
              {session
                ? '🍀 Feeling lucky? Step into the casino 🎲'
                : 'Login with Discord and join the fun 🎰'}
            </p>
          </div>

          {session ? (
            <div className="flex flex-col items-center gap-4">
              <ContinueToDiscordButton />
              <LogoutButton />
            </div>
          ) : (
            <div className="flex w-full justify-center">
              <LoginButton />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const LoginButton = () => {
  return (
    <Button
      onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
      className="h-12 w-full cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white shadow-lg transition duration-300 hover:scale-[1.03] active:scale-[0.99]"
    >
      🎮 Login with Discord
    </Button>
  )
}

const LogoutButton = () => {
  return (
    <Button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="hover:bg-background h-12 w-full cursor-pointer rounded-xl border border-red-400/50 px-4 py-3 font-medium transition hover:scale-[1.02] active:scale-[0.99]"
      variant={'outline'}
    >
      Logout
    </Button>
  )
}

const ContinueToDiscordButton = () => {
  return (
    <Button
      variant={'link'}
      asChild
      className="h-13 w-full rounded-xl bg-linear-to-r from-yellow-500 to-yellow-600 px-4 py-3 text-center font-bold text-black shadow-lg transition hover:scale-[1.02] hover:no-underline active:scale-[0.99]"
      size={'lg'}
    >
      <Link
        className="inline-flex items-center justify-center gap-2"
        href="/dashboard"
      >
        <Dice5 className="h-5 w-5" /> Continue to Dashboard
      </Link>
    </Button>
  )
}

export default LoginBox
