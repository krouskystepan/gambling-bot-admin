import { TriangleAlert } from 'lucide-react'

const RTPWarning = ({ value }: { value: number }) => {
  if (value >= 100) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-destructive">
        <TriangleAlert size={14} className="shrink-0" />
        ≥ 100%
      </span>
    )
  }

  if (value <= 90) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-brand">
        <TriangleAlert size={14} className="shrink-0" />
        ≤ 90%
      </span>
    )
  }

  return null
}

export const MultiRTP = ({ rtpMap }: { rtpMap: Record<string, number> }) => (
  <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
    <span className="font-medium">RTPs:</span>
    {Object.entries(rtpMap).map(([bet, value], index, array) => (
      <span key={bet} className="inline-flex items-center gap-1.5">
        <span>
          {bet}: <span className="tabular-nums">{value.toFixed(2)}%</span>
        </span>
        <RTPWarning value={value} />
        {index < array.length - 1 && (
          <span className="text-muted-foreground/60">,</span>
        )}
      </span>
    ))}
  </div>
)

export const SingleRTP = ({ value }: { value: number }) => (
  <div className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
    <span className="font-medium">RTP:</span>
    <span className="tabular-nums">{value.toFixed(2)}%</span>
    <RTPWarning value={value} />
  </div>
)
