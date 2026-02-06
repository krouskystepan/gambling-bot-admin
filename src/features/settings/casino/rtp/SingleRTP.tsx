import { RTPWarning } from './RTPWarning'

export const SingleRTP = ({ value }: { value: number }) => (
  <span className="flex items-center gap-1 text-xs text-gray-400">
    <span className="font-medium">RTP:</span>
    {value.toFixed(2)}% <RTPWarning value={value} />
  </span>
)
