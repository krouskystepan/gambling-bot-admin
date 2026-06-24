'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { DevTool } from '../devTools'

type DevActionsPanelProps = {
  guildId: string
  title?: string
  description?: string
  tools: DevTool[]
}

const formatResult = (result: unknown) => JSON.stringify(result, null, 2)

const DevActionsPanel = ({
  guildId,
  title = 'Actions',
  description = 'Dev-gated tools. Results are JSON for inspection.',
  tools
}: DevActionsPanelProps) => {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const runTool = (tool: DevTool) => {
    setActiveTool(tool.id)
    startTransition(async () => {
      const response = await tool.run(guildId)
      setResult(formatResult(response))
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? 'default' : 'outline'}
              size="sm"
              disabled={isPending}
              onClick={() => runTool(tool)}
            >
              {isPending && activeTool === tool.id ? 'Running…' : tool.label}
            </Button>
          ))}
        </div>

        {result ? (
          <ScrollArea className="h-80 rounded-lg border bg-muted/30 p-3">
            <pre className="text-xs whitespace-pre-wrap">{result}</pre>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">
            Run an action to inspect the response here.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default DevActionsPanel
