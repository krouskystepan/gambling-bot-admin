import { TriangleAlert } from 'lucide-react'

export const RTPWarning = ({ value }: { value: number }) => {
  if (value >= 100) {
    return (
      <span className="flex items-center gap-1 text-red-600">
        <TriangleAlert size={16} /> ≥ 100%
      </span>
    )
  }

  if (value >= 95) {
    return (
      <span className="flex items-center gap-1 text-amber-500">
        <TriangleAlert size={16} /> ≥ 95%
      </span>
    )
  }

  return null
}
