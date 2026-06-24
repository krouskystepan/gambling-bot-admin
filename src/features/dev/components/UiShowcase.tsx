import { Button } from '@/components/ui/button'

const UiShowcase = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Button variants
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="discord">Discord</Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Button sizes
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="ghost" aria-label="Icon button">
            …
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Button states
        </p>
        <div className="flex flex-wrap gap-2">
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>
            Disabled outline
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UiShowcase
