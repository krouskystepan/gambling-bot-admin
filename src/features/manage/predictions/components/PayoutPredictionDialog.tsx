'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  getPredictionDetail,
  payoutPrediction
} from '@/actions/database/predictionActions.action'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { TPredictionRow } from '@/types/types'

type PayoutPredictionDialogProps = {
  guildId: string
  prediction: TPredictionRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PayoutPreview = {
  winners: number
  losers: number
  totalWon: number
  totalLost: number
  casinoProfit: number
}

const PayoutPredictionDialog = ({
  guildId,
  prediction,
  open,
  onOpenChange
}: PayoutPredictionDialogProps) => {
  const router = useRouter()
  const [winnerChoice, setWinnerChoice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [payoutPreview, setPayoutPreview] = useState<PayoutPreview | null>(null)

  const resetPreview = () => {
    setPayoutPreview(null)
    setSummaryError(null)
    setLoadingSummary(false)
  }

  const loadPreview = async (nextWinnerChoice: string) => {
    if (!prediction || !nextWinnerChoice) {
      resetPreview()
      return
    }

    setLoadingSummary(true)
    setSummaryError(null)
    setPayoutPreview(null)

    try {
      const result = await getPredictionDetail(guildId, prediction.predictionId)
      if ('error' in result) {
        setSummaryError(result.error)
        return
      }

      const winner = result.choices.find(
        (c) => c.choiceName === nextWinnerChoice
      )
      if (!winner) {
        setSummaryError('Selected winner not found.')
        return
      }

      const winners = winner.bets.map((bet) => ({
        winAmount: bet.amount * winner.odds
      }))
      const losers = result.choices
        .filter((c) => c.choiceName !== nextWinnerChoice)
        .flatMap((c) => c.bets)

      const totalWon = winners.reduce((sum, w) => sum + w.winAmount, 0)
      const totalLost = losers.reduce((sum, l) => sum + l.amount, 0)

      setPayoutPreview({
        winners: winners.length,
        losers: losers.length,
        totalWon,
        totalLost,
        casinoProfit: totalLost - totalWon
      })
    } catch {
      setSummaryError('Failed to load payout preview.')
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleWinnerChange = (nextWinnerChoice: string) => {
    setWinnerChoice(nextWinnerChoice)
    void loadPreview(nextWinnerChoice)
  }

  const handlePayout = async () => {
    if (!prediction || !winnerChoice) return

    setIsSubmitting(true)
    try {
      const result = await payoutPrediction(
        guildId,
        prediction.predictionId,
        winnerChoice
      )

      if (result.success) {
        toast.success(result.message)
        setWinnerChoice('')
        resetPreview()
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to payout prediction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setWinnerChoice('')
          resetPreview()
        }
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Payout prediction</AlertDialogTitle>
          <AlertDialogDescription>
            Pay winners for <strong>{prediction?.title}</strong> and post a log
            to the configured logs channel.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Winning choice</Label>
            <Select value={winnerChoice} onValueChange={handleWinnerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select winner" />
              </SelectTrigger>
              <SelectContent>
                {prediction?.choicesEnriched.map((choice) => (
                  <SelectItem key={choice.choiceName} value={choice.choiceName}>
                    {choice.choiceName} ({choice.odds}x)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingSummary ? (
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          ) : summaryError ? (
            <p className="text-sm text-destructive">{summaryError}</p>
          ) : payoutPreview ? (
            <div className="rounded-md border p-3 text-sm">
              <p>Winners: {payoutPreview.winners}</p>
              <p>Losers: {payoutPreview.losers}</p>
              <p>Total payout: {formatGuildMoney(payoutPreview.totalWon)}</p>
              <p>
                Casino profit/loss:{' '}
                {formatGuildMoney(payoutPreview.casinoProfit)}
              </p>
            </div>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePayout}
            disabled={isSubmitting || !winnerChoice}
          >
            Confirm payout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default PayoutPredictionDialog
