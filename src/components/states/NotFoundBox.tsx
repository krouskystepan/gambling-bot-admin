import { AlertCircle } from 'lucide-react'

import Link from 'next/link'

import { Button } from '../ui/button'
import StateLayout from './StateLayout'

const NotFoundBox = () => {
  return (
    <StateLayout
      Icon={
        <AlertCircle className="h-12 w-12 animate-pulse text-destructive drop-shadow-lg" />
      }
      titleText="404 - Page Not Found"
      titleTone="destructive"
      description="Sorry, the page you are looking for does not exist. Check the URL or go back to the dashboard."
      button={
        <Button variant="destructive" className="mt-2 px-6 py-3 font-semibold" asChild>
          <Link href={'/'}>Go Back Home</Link>
        </Button>
      }
    />
  )
}

export default NotFoundBox
