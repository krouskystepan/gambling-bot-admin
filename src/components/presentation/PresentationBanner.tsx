import { Info } from 'lucide-react'

const PresentationBanner = () => (
  <div className="flex shrink-0 items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
    <Info size={14} className="shrink-0" />
    <span>
      Presentation mode — sample data. Changes are disabled in this demo.
    </span>
  </div>
)

export default PresentationBanner
