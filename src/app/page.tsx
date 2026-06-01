import { getServerSession } from 'next-auth'

import LandingAuthCard from '@/components/landing/LandingAuthCard'
import LandingShell from '@/components/landing/LandingShell'
import { authOptions } from '@/lib/authOptions'

const Home = async () => {
  const session = await getServerSession(authOptions)

  return (
    <LandingShell>
      <LandingAuthCard session={session} />
    </LandingShell>
  )
}

export default Home
