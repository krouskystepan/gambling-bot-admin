'use client'

import { parseReadableStringToNumber } from 'gambling-bot-shared/common'
import { CircleQuestionMark, RotateCw } from 'lucide-react'
import { type ControllerRenderProps, Path } from 'react-hook-form'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TCasinoSettingsForm, TCasinoSettingsInput } from '@/types/types'

type Props = {
  name: Path<TCasinoSettingsInput>
  label: string
  defaultValue?: number
  form: TCasinoSettingsForm
  onValueCommit?: (value: number) => void
  /** Accept compact money suffixes like `2k` / `4.5M` (minBet / maxBet). */
  compactMoney?: boolean
  /**
   * Stored as 0–1 fraction; UI shows/edits percent points (10 = 10% = 0.1).
   * Mutually exclusive with compactMoney.
   */
  percent?: boolean
  description?: string
  /** Short tooltip next to the label explaining this specific field. */
  help?: string
}

const parsePlainNumberFieldValue = (raw: string): number => {
  if (raw === '') return 0
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? 0 : parsed
}

const parseCompactMoneyFieldValue = (raw: string): number => {
  const trimmed = raw.trim()
  if (trimmed === '') return 0
  const parsed = parseReadableStringToNumber(trimmed)
  return Number.isNaN(parsed) ? 0 : parsed
}

const sanitizePlainDraft = (raw: string): string => raw.replace(/[^0-9.]/g, '')

const sanitizeCompactMoneyDraft = (raw: string): string =>
  raw.replace(/[^0-9.kKmMbB]/g, '')

/** Fraction (0.03) ↔ percent points (3) without float noise. */
const fractionToPercentPoints = (fraction: number): number =>
  parseFloat((fraction * 100).toPrecision(12))

const percentPointsToFraction = (percentPoints: number): number =>
  parseFloat((percentPoints / 100).toPrecision(12))

const formatStoredForUi = (
  stored: number | undefined,
  percent: boolean
): string => {
  const value = Number(stored ?? 0)
  return String(percent ? fractionToPercentPoints(value) : value)
}

type NumberFieldInputProps = {
  field: ControllerRenderProps<TCasinoSettingsInput, Path<TCasinoSettingsInput>>
  label: string
  defaultValue?: number
  onValueCommit?: (value: number) => void
  compactMoney: boolean
  percent: boolean
  description?: string
  help?: string
}

const NumberFieldInput = ({
  field,
  label,
  defaultValue,
  onValueCommit,
  compactMoney,
  percent,
  description,
  help
}: NumberFieldInputProps) => {
  const [draft, setDraft] = useState(() =>
    formatStoredForUi(field.value as number | undefined, percent)
  )
  const [isFocused, setIsFocused] = useState(false)
  const displayValue = isFocused
    ? draft
    : formatStoredForUi(field.value as number | undefined, percent)

  const toStored = (uiValue: number): number =>
    percent ? percentPointsToFraction(uiValue) : uiValue

  const commit = (raw: string) => {
    const uiParsed = compactMoney
      ? parseCompactMoneyFieldValue(raw)
      : parsePlainNumberFieldValue(raw)
    const stored = toStored(uiParsed)
    field.onChange(stored)
    field.onBlur()
    onValueCommit?.(stored)
    setDraft(formatStoredForUi(stored, percent))
  }

  return (
    <FormItem>
      <div className="flex items-center gap-1">
        <Label>{label}</Label>
        {help ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex text-muted-foreground hover:text-foreground"
                aria-label={`About ${label}`}
              >
                <CircleQuestionMark size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="leading-relaxed">{help}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <FormControl>
        <div className="flex rounded-md shadow-xs">
          <Input
            variant="muted"
            className="rounded-r-none"
            placeholder={
              compactMoney
                ? 'e.g. 1000, 2k, 4.5k'
                : percent
                  ? 'e.g. 3'
                  : undefined
            }
            value={displayValue}
            onFocus={() => {
              setDraft(
                formatStoredForUi(field.value as number | undefined, percent)
              )
              setIsFocused(true)
            }}
            onChange={(e) => {
              const cleaned = compactMoney
                ? sanitizeCompactMoneyDraft(e.target.value)
                : sanitizePlainDraft(e.target.value)
              setDraft(cleaned)

              if (cleaned === '' || cleaned.endsWith('.')) return

              if (compactMoney) {
                const parsed = parseReadableStringToNumber(cleaned)
                if (!Number.isNaN(parsed)) {
                  field.onChange(parsed)
                }
                return
              }

              field.onChange(toStored(parsePlainNumberFieldValue(cleaned)))
            }}
            onBlur={(e) => {
              commit(e.target.value)
              setIsFocused(false)
            }}
          />
          {defaultValue !== undefined && (
            <Button
              type="button"
              variant="ghost"
              className="bg-muted text-destructive/60 hover:text-destructive w-9 rounded-none rounded-e-md"
              onClick={() => {
                setDraft(formatStoredForUi(defaultValue, percent))
                field.onChange(defaultValue)
                onValueCommit?.(defaultValue)
              }}
            >
              <RotateCw size={16} />
            </Button>
          )}
        </div>
      </FormControl>
      {description ? (
        <FormDescription className="text-xs">{description}</FormDescription>
      ) : null}
      <FormMessage />
    </FormItem>
  )
}

export const NumberField = ({
  name,
  label,
  defaultValue,
  form,
  onValueCommit,
  compactMoney = false,
  percent = false,
  description,
  help
}: Props) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <NumberFieldInput
        field={field}
        label={label}
        defaultValue={defaultValue}
        onValueCommit={onValueCommit}
        compactMoney={compactMoney}
        percent={percent}
        description={description}
        help={help}
      />
    )}
  />
)
