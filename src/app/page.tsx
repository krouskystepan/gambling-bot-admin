import LandingAuthCard from '@/components/landing/LandingAuthCard'
import LandingShell from '@/components/landing/LandingShell'
import { getSessionOrNull } from '@/lib/auth/requireSession'

const Home = async () => {
  const session = await getSessionOrNull()

  return (
    <LandingShell>
      <LandingAuthCard session={session} />
    </LandingShell>
  )
}

export default Home
