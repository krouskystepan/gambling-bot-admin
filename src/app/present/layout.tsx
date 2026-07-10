import { PresentationProvider } from '@/components/presentation/PresentationProvider'
import { Toaster } from '@/components/ui/sonner'

const PresentationRootLayout = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <PresentationProvider>
      {children}
      <Toaster richColors position="bottom-right" />
    </PresentationProvider>
  )
}

export default PresentationRootLayout
