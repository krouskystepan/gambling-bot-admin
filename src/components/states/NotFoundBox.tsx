import { AlertCircle } from 'lucide-react'

import Link from 'next/link'

import { Button } from '../ui/button'
import StateLayout from './StateLayout'

const NotFoundBox = () => {
  return (
    <StateLayout
      Icon={
        <AlertCircle className="h-12 w-12 animate-pulse text-red-500 drop-shadow-lg" />
      }
      titleText="404 - Page Not Found"
      titleStyle="bg-linear-to-r from-red-600 to-red-500 bg-clip-text text-transparent animate-gradient-x"
      description="Sorry, the page you are looking for does not exist. Check the URL or go back to the dashboard."
      button={
        <Button
          className="mt-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-red-700"
          asChild
        >
          <Link href={'/'}>Go Back Home</Link>
        </Button>
      }
    />
  )
}

export default NotFoundBox
