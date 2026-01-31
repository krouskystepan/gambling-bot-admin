import BackgroundPattern from '@/components/BackgroundPattern'
import CornerCircles from '@/components/CornerCircles'
import LoginBox from '@/components/LoginBox'

const LoginPage = async () => {
  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden bg-linear-to-br from-black via-[#1a1a1a] to-[#0f0f0f]">
      <CornerCircles />
      <BackgroundPattern />

      <LoginBox session={null} />
    </section>
  )
}

export default LoginPage
