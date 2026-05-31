import { redirect } from 'next/navigation'

import BackgroundPattern from '@/components/BackgroundPattern'
import CornerCircles from '@/components/CornerCircles'
import LoginBox from '@/components/LoginBox'
import {
  getSessionOrNull,
  safeCallbackUrl
} from '@/lib/requireSession'

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { callbackUrl } = await searchParams
  const session = await getSessionOrNull()

  if (session) {
    redirect(safeCallbackUrl(callbackUrl))
  }

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden bg-linear-to-br from-black via-[#1a1a1a] to-[#0f0f0f]">
      <CornerCircles />
      <BackgroundPattern />

      <LoginBox
        session={null}
        callbackUrl={safeCallbackUrl(callbackUrl)}
      />
    </section>
  )
}

export default LoginPage
