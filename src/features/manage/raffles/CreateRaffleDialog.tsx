'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createRaffle } from '@/actions/database/raffleActions.action'
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

type CreateRaffleDialogProps = {
  guildId: string
  raffleConfigured: boolean
  raffleFeatureBlocked: boolean
  raffleFeatureBlockMessage: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CreateRaffleDialog = ({
  guildId,
  raffleConfigured,
  raffleFeatureBlocked,
  raffleFeatureBlockMessage,
  open,
  onOpenChange
}: CreateRaffleDialogProps) => {
  const router = useRouter()
  const [ticketPrice, setTicketPrice] = useState('')
  const [maxTickets, setMaxTickets] = useState('10')
  const [drawDate, setDrawDate] = useState<Date | undefined>()
  const [drawTime, setDrawTime] = useState('')
  const [interval, setInterval] = useState('1d')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setTicketPrice('')
    setMaxTickets('10')
    setDrawDate(undefined)
    setDrawTime('')
    setInterval('1d')
  }

  const handleSubmit = async () => {
    const maxTicketsNum = Number(maxTickets)
    if (
      !Number.isInteger(maxTicketsNum) ||
      maxTicketsNum < 1 ||
      maxTicketsNum > 100
    ) {
      toast.error('Max tickets must be between 1 and 100.')
      return
    }

    if (!drawDate || !drawTime) {
      toast.error('Select a draw date and time.')
      return
    }

    const drawDt = pragueDateTimeFromPicker(drawDate, drawTime)
    if (!drawDt || drawDt.toMillis() <= Date.now()) {
      toast.error('Draw time must be in the future.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createRaffle(guildId, {
        ticketPrice: ticketPrice.trim(),
        maxTickets: maxTicketsNum,
        drawTime: drawDt.toISO()!,
        interval: interval.trim()
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
      toast.error('Failed to create raffle.')
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create raffle</DialogTitle>
          <DialogDescription>
            Post a new global raffle to the configured actions channel with buy
            buttons.
          </DialogDescription>
        </DialogHeader>

        {!raffleConfigured ? (
          <p className="text-sm text-muted-foreground">
            Raffle actions channel is not configured. Set it in{' '}
            <Link
              href={`/dashboard/g/${guildId}/channel-settings`}
              className="text-primary hover:underline"
            >
              Channel settings
            </Link>
            .
          </p>
        ) : raffleFeatureBlocked ? (
          <p className="text-sm text-muted-foreground">
            {raffleFeatureBlockMessage}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="raffle-ticket-price">Ticket price</Label>
              <Input
                id="raffle-ticket-price"
                value={ticketPrice}
                onChange={(event) => setTicketPrice(event.target.value)}
                placeholder="e.g. 1000, 2k, 4.5k"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raffle-max-tickets">Max tickets per user</Label>
              <Input
                id="raffle-max-tickets"
                type="number"
                min={1}
                max={100}
                value={maxTickets}
                onChange={(event) => setMaxTickets(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raffle-draw-time">
                First draw (Europe/Prague)
              </Label>
              <DateTimePicker
                id="raffle-draw-time"
                date={drawDate}
                time={drawTime}
                onDateChange={setDrawDate}
                onTimeChange={setDrawTime}
                disablePastDates
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raffle-interval">Repeat interval</Label>
              <Input
                id="raffle-interval"
                value={interval}
                onChange={(event) => setInterval(event.target.value)}
                placeholder="e.g. 10m, 2h, 1d, 1w"
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
              !raffleConfigured ||
              raffleFeatureBlocked ||
              !ticketPrice.trim()
            }
          >
            Create raffle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateRaffleDialog
