'use client'

import { Loader2 } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { usePresentationReadOnly } from '@/components/presentation/PresentationProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FormActionsFooterProps = {
  label?: string
  hint?: string
  showDiscard?: boolean
}

const FormActionsFooter = ({
  label = 'Save changes',
  hint,
  showDiscard = true
}: FormActionsFooterProps) => {
  const { formState, reset } = useFormContext()
  const { isDirty, isSubmitting, isValid } = formState
  const readOnly = usePresentationReadOnly()

  const canSave = isDirty && isValid && !isSubmitting
  const showDiscardButton = showDiscard && isDirty && !readOnly

  if (readOnly) {
    return (
      <div className="mt-2 border-t border-border pt-4">
        <p className="text-right text-sm text-muted-foreground">
          Read-only demo — settings can be viewed but not saved.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2 border-t border-border pt-4">
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center',
          hint ? 'sm:justify-between' : 'sm:justify-end'
        )}
      >
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
        <div className="flex justify-end gap-2">
          {showDiscardButton ? (
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => reset()}
            >
              Discard changes
            </Button>
          ) : null}
          <Button type="submit" variant="default" disabled={!canSave}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              label
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FormActionsFooter
