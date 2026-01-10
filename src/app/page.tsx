import { getServerSession } from 'next-auth'

import BackgroundPattern from '@/components/BackgroundPattern'
import CornerCircles from '@/components/CornerCircles'
import LoginBox from '@/components/LoginBox'
import { authOptions } from '@/lib/authOptions'

const Home = async () => {
  const session = await getServerSession(authOptions)

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden bg-linear-to-br from-black via-[#1a1a1a] to-[#0f0f0f]">
      <CornerCircles />
      <BackgroundPattern />

      <LoginBox session={session} />
    </section>
  )
}

export default Home
