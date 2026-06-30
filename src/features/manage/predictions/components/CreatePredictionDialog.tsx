'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createPrediction } from '@/actions/database/predictionActions.action'
import DateTimePicker, {
  pragueDateTimeFromPicker
} from '@/components/form/DateTimePicker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ChoiceRow = {
  choiceName: string
  odds: string
}

type CreatePredictionDialogProps = {
  guildId: string
  channelsConfigured: boolean
  predictionFeatureBlocked: boolean
  predictionFeatureBlockMessage: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultChoices = (): ChoiceRow[] => [
  { choiceName: '', odds: '' },
  { choiceName: '', odds: '' }
]

const CreatePredictionDialog = ({
  guildId,
  channelsConfigured,
  predictionFeatureBlocked,
  predictionFeatureBlockMessage,
  open,
  onOpenChange
}: CreatePredictionDialogProps) => {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [choices, setChoices] = useState<ChoiceRow[]>(defaultChoices)
  const [autolockDate, setAutolockDate] = useState<Date | undefined>()
  const [autolockTime, setAutolockTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setTitle('')
    setChoices(defaultChoices())
    setAutolockDate(undefined)
    setAutolockTime('')
  }

  const updateChoice = (
    index: number,
    field: keyof ChoiceRow,
    value: string
  ) => {
    setChoices((prev) =>
      prev.map((choice, i) =>
        i === index ? { ...choice, [field]: value } : choice
      )
    )
  }

  const addChoice = () => {
    if (choices.length >= 3) return
    setChoices((prev) => [...prev, { choiceName: '', odds: '' }])
  }

  const removeChoice = (index: number) => {
    if (choices.length <= 2) return
    setChoices((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const parsedChoices = choices.map((choice) => ({
      choiceName: choice.choiceName.trim(),
      odds: Number(choice.odds)
    }))

    if (!title.trim()) {
      toast.error('Enter a prediction title.')
      return
    }

    if (parsedChoices.some((c) => !c.choiceName || !c.odds || c.odds <= 0)) {
      toast.error('Each choice needs a name and positive odds.')
      return
    }

    let autolock: string | undefined
    if (autolockDate && autolockTime) {
      const autolockDt = pragueDateTimeFromPicker(autolockDate, autolockTime)
      if (!autolockDt || autolockDt.toMillis() <= Date.now()) {
        toast.error('Autolock must be in the future.')
        return
      }
      autolock = autolockDt.toISO()!
    }

    setIsSubmitting(true)
    try {
      const result = await createPrediction(guildId, {
        title: title.trim(),
        choices: parsedChoices,
        autolock
      })

      if (result.success) {
        toast.success(result.message)
        resetForm()
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to create prediction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create prediction</DialogTitle>
          <DialogDescription>
            Post a new prediction to the configured actions channel with bet
            buttons.
          </DialogDescription>
        </DialogHeader>

        {!channelsConfigured ? (
          <p className="text-sm text-muted-foreground">
            Prediction channels are not fully configured. Set actions and logs
            in{' '}
            <Link
              href={`/dashboard/g/${guildId}/channel-settings`}
              className="text-primary hover:underline"
            >
              Channel settings
            </Link>
            .
          </p>
        ) : predictionFeatureBlocked ? (
          <p className="text-sm text-muted-foreground">
            {predictionFeatureBlockMessage}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prediction-title">Title</Label>
              <Input
                id="prediction-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Who wins the match?"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Choices</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={choices.length >= 3}
                  onClick={addChoice}
                >
                  Add choice
                </Button>
              </div>

              {choices.map((choice, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_96px_auto] gap-2"
                >
                  <Input
                    value={choice.choiceName}
                    onChange={(event) =>
                      updateChoice(index, 'choiceName', event.target.value)
                    }
                    placeholder="Choice name"
                  />
                  <Input
                    value={choice.odds}
                    onChange={(event) =>
                      updateChoice(index, 'odds', event.target.value)
                    }
                    placeholder="Odds"
                    type="number"
                    min={0.01}
                    step="0.01"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={choices.length <= 2}
                    onClick={() => removeChoice(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prediction-autolock">
                Auto-lock (optional, Europe/Prague)
              </Label>
              <DateTimePicker
                id="prediction-autolock"
                date={autolockDate}
                time={autolockTime}
                onDateChange={setAutolockDate}
                onTimeChange={setAutolockTime}
                disablePastDates
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !channelsConfigured ||
              predictionFeatureBlocked ||
              !title.trim()
            }
          >
            Create prediction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePredictionDialog
