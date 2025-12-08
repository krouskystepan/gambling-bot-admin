'use client'

import { motion } from 'framer-motion'
import { Dice5 } from 'lucide-react'
import { Session } from 'next-auth'
import { signOut, signIn } from 'next-auth/react'
import { Button } from './ui/button'
import Link from 'next/link'

const LoginBox = ({ session }: { session: Session | null }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-10 w-[92%] max-w-lg"
    >
      <div className="relative group rounded-2xl p-px bg-linear-to-br from-yellow-500/50 via-yellow-300/20 to-transparent shadow-[0_0_40px_rgba(255,215,0,0.12)]">
        <div className="p-6 relative rounded-2xl bg-black/60 border border-yellow-500/20 shadow-lg">
          <div className="mb-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl mb-0 font-extrabold bg-linear-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-clip-text text-transparent animate-gradient-x bg-size-[200%_200%]">
                {session ? 'Welcome Back!' : 'Welcome'}
              </h1>
            </div>

            <p className="text-base text-center text-gray-300">
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
            <div className="w-full flex justify-center">
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
      className="cursor-pointer w-full rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-3 text-white font-semibold shadow-lg hover:scale-[1.03] active:scale-[0.99] transition duration-300 h-12"
    >
      🎮 Login with Discord
    </Button>
  )
}

const LogoutButton = () => {
  return (
    <Button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="cursor-pointer w-full rounded-xl border border-red-400/50 px-4 py-3 font-medium hover:scale-[1.02] active:scale-[0.99] hover:bg-background transition h-12"
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
      className="w-full rounded-xl bg-linear-to-r from-yellow-500 to-yellow-600 px-4 py-3 text-center text-black font-bold shadow-lg hover:scale-[1.02] active:scale-[0.99] transition h-13 hover:no-underline"
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
