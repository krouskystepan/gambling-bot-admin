import { formatNumberToReadableString } from '@/lib/utils'

type PreviewDay = {
  day: number
  reward: number
  base: number
  weekly: number
  monthly: number
  isReset: boolean
}

type BonusesCalendarProps = {
  preview: PreviewDay[]
}

const BonusesCalendar = ({ preview }: BonusesCalendarProps) => {
  const weeks: PreviewDay[][] = []

  for (let i = 0; i < preview.length; i += 7) {
    weeks.push(preview.slice(i, i + 7))
  }

  return (
    <div className="bg-black/40 rounded-md w-full p-2 text-white">
      <h5 className="mb-2 text-lg font-semibold text-yellow-400">
        Preview (Next {preview.length} Days)
      </h5>

      <div className="hide-scrollbar max-h-180 overflow-y-auto space-y-3">
        {weeks.map((week, weekIndex) => {
          const isNewMonth = weekIndex % 4 === 0

          return (
            <div
              key={weekIndex}
              className={`grid grid-cols-7 gap-2 ${
                isNewMonth ? 'pt-2 border-t border-yellow-400/30' : ''
              }`}
            >
              {week.map((p) => (
                <div
                  key={p.day}
                  className={`flex flex-col border border-gray-700 p-2 text-xs ${
                    p.isReset ? 'bg-red-900/20' : ''
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-gray-400">#{p.day}</span>
                    <span className="font-semibold">
                      {formatNumberToReadableString(p.reward)}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-col gap-0.5">
                    <span className="text-gray-300">
                      B: {formatNumberToReadableString(p.base)}
                    </span>

                    {p.weekly > 0 && (
                      <span className="text-blue-400">
                        W: {formatNumberToReadableString(p.weekly)}
                      </span>
                    )}

                    {p.monthly > 0 && (
                      <span className="font-bold text-green-400">
                        M: {formatNumberToReadableString(p.monthly)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BonusesCalendar
