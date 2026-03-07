import { PreviewDay } from 'gambling-bot-shared'

import { formatNumberToReadableString } from '@/lib/utils'

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
        'flex flex-col rounded-md border border-neutral-800 bg-neutral-900/60 p-2 text-xs',
        'transition-colors',
        isReset ? 'border-red-700/60 bg-red-950/30' : ''
      ].join(' ')}
    >
      <span className="text-xs tracking-wide text-neutral-500">
        #{dayNumber}
      </span>

      <div className="mt-1 space-y-0.5 text-xs">
        <span className="text-yellow-400">
          T: {formatNumberToReadableString(reward)}
        </span>

        <div className="text-neutral-400">
          B: {formatNumberToReadableString(base)}
        </div>

        {weekly > 0 && (
          <div className="text-blue-400">
            W: {formatNumberToReadableString(weekly)}
          </div>
        )}

        {monthly > 0 && (
          <div className="font-semibold text-green-400">
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
    <section className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 text-white">
      <header className="mb-4 flex items-center justify-between">
        <h5 className="text-base font-semibold text-yellow-400">
          Preview ({preview.length} Days)
        </h5>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-yellow-400 font-medium">T = Total</span>
          <span className="text-neutral-400">B = Base</span>
          <span className="text-blue-400">W = Weekly</span>
          <span className="text-green-400">M = Monthly</span>
        </div>
      </header>

      <div className="hide-scrollbar max-h-180 space-y-2 overflow-y-auto pr-1">
        {weeks.map((week, index) => {
          const showDivider = index !== 0 && index % 4 === 0

          return (
            <div key={index} className="space-y-2">
              {showDivider && <div className="h-px w-full bg-yellow-500/20" />}

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
