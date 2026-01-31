'use client'

import { Loader2, Save } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { Button } from './ui/button'

const SaveButton = () => {
  const { formState } = useFormContext()

  return (
    <Button
      type="submit"
      variant="save"
      className="flex w-fit cursor-pointer items-center gap-2"
      size="lg"
      disabled={formState.isSubmitting}
    >
      {formState.isSubmitting ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Save className="h-5 w-5" />
      )}
      Save
    </Button>
  )
}

export default SaveButton
