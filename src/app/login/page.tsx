import { redirect } from 'next/navigation'

import LandingAuthCard from '@/components/landing/LandingAuthCard'
import LandingShell from '@/components/landing/LandingShell'
import { getSessionOrNull, safeCallbackUrl } from '@/lib/requireSession'

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
    <LandingShell>
      <LandingAuthCard
        session={null}
        callbackUrl={safeCallbackUrl(callbackUrl)}
      />
    </LandingShell>
  )
}

export default LoginPage
