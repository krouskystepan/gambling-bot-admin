import { RTPWarning } from './RTPWarning'

export const MultiRTP = ({ rtpMap }: { rtpMap: Record<string, number> }) => (
  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
    <span className="font-medium">RTPs:</span>
    {Object.entries(rtpMap).map(([bet, value]) => (
      <span key={bet} className="flex items-center gap-1">
        {bet}: {value.toFixed(2)}% <RTPWarning value={value} />
      </span>
    ))}
  </div>
)
