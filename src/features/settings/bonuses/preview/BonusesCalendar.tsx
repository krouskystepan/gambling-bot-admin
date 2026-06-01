import { PreviewDay } from 'gambling-bot-shared'
import { formatNumberToReadableString } from 'gambling-bot-shared'

type BonusesCalendarProps = {
  preview: PreviewDay[]
}

const chunkIntoWeeks = (days: PreviewDay[]): PreviewDay[][] => {
  const result: PreviewDay[][] = []

  for (let i = 0; i < days.length; i += 7) {
    result.push(days.slice(i, i + 7))
  }

  return result
}

const DayCard = ({ day }: { day: PreviewDay }) => {
  const { day: dayNumber, reward, base, weekly, monthly, isReset } = day

  return (
    <div
      className={[
        'flex flex-col rounded-md border border-border bg-card/60 p-2 text-xs',
        'transition-colors',
        isReset ? 'border-destructive/60 bg-destructive/10' : ''
      ].join(' ')}
    >
      <span className="text-xs tracking-wide text-muted-foreground">
        #{dayNumber}
      </span>

      <div className="mt-1 space-y-0.5 text-xs">
        <span className="text-primary">
          T: {formatNumberToReadableString(reward)}
        </span>

        <div className="text-muted-foreground">
          B: {formatNumberToReadableString(base)}
        </div>

        {weekly > 0 && (
          <div className="text-chart-1">
            W: {formatNumberToReadableString(weekly)}
          </div>
        )}

        {monthly > 0 && (
          <div className="font-semibold text-chart-2">
            M: {formatNumberToReadableString(monthly)}
          </div>
        )}
      </div>
    </div>
  )
}

const BonusesCalendar = ({ preview }: BonusesCalendarProps) => {
  const weeks = chunkIntoWeeks(preview)

  return (
    <section className="w-full rounded-lg border border-border bg-card/60 p-4 text-foreground">
      <header className="mb-4 flex items-center justify-between">
        <h5 className="text-base font-semibold text-primary">
          Preview ({preview.length} Days)
        </h5>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium text-primary">T = Total</span>
          <span className="text-muted-foreground">B = Base</span>
          <span className="text-chart-1">W = Weekly</span>
          <span className="text-chart-2">M = Monthly</span>
        </div>
      </header>

      <div className="hide-scrollbar max-h-180 space-y-2 overflow-y-auto pr-1">
        {weeks.map((week, index) => {
          const showDivider = index !== 0 && index % 4 === 0

          return (
            <div key={index} className="space-y-2">
              {showDivider && <div className="h-px w-full bg-primary/20" />}

              <div className="grid grid-cols-7 gap-1">
                {week.map((day) => (
                  <DayCard key={day.day} day={day} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default BonusesCalendar
