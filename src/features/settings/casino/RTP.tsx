import { TriangleAlert } from 'lucide-react'

const RTPWarning = ({ value }: { value: number }) => {
  if (value >= 100) {
    return (
      <span className="flex items-center gap-1 text-destructive">
        <TriangleAlert size={16} /> ≥ 100%
      </span>
    )
  }

  if (value <= 90) {
    return (
      <span className="flex items-center gap-1 text-brand">
        <TriangleAlert size={16} /> ≤ 90%
      </span>
    )
  }

  return null
}

export const MultiRTP = ({ rtpMap }: { rtpMap: Record<string, number> }) => (
  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
    <span className="font-medium">RTPs:</span>
    {Object.entries(rtpMap).map(([bet, value], index, array) => (
      <span key={bet} className="text-xs inline-flex items-center gap-1">
        {bet}: {value.toFixed(2)}% <RTPWarning value={value} />
        {index < array.length - 1 && ','}
      </span>
    ))}
  </div>
)

export const SingleRTP = ({ value }: { value: number }) => (
  <span className="flex items-center gap-1 text-muted-foreground">
    <span className="font-medium">RTP:</span>
    <span className="text-xs inline-flex items-center gap-1">
      {value.toFixed(2)}% <RTPWarning value={value} />
    </span>
  </span>
)
