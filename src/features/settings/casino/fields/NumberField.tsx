'use client'

import { parseReadableStringToNumber } from 'gambling-bot-shared/common'
import { RotateCw } from 'lucide-react'
import { type ControllerRenderProps, Path } from 'react-hook-form'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TCasinoSettingsForm, TCasinoSettingsInput } from '@/types/types'

type Props = {
  name: Path<TCasinoSettingsInput>
  label: string
  defaultValue?: number
  form: TCasinoSettingsForm
  onValueCommit?: (value: number) => void
  /** Accept compact money suffixes like `2k` / `4.5M` (minBet / maxBet). */
  compactMoney?: boolean
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

type NumberFieldInputProps = {
  field: ControllerRenderProps<TCasinoSettingsInput, Path<TCasinoSettingsInput>>
  label: string
  defaultValue?: number
  onValueCommit?: (value: number) => void
  compactMoney: boolean
}

const NumberFieldInput = ({
  field,
  label,
  defaultValue,
  onValueCommit,
  compactMoney
}: NumberFieldInputProps) => {
  const [draft, setDraft] = useState(() => String(field.value ?? ''))
  const [isFocused, setIsFocused] = useState(false)
  const displayValue = isFocused ? draft : String(field.value ?? '')

  const commit = (raw: string) => {
    const parsed = compactMoney
      ? parseCompactMoneyFieldValue(raw)
      : parsePlainNumberFieldValue(raw)
    field.onChange(parsed)
    field.onBlur()
    onValueCommit?.(parsed)
  }

  return (
    <FormItem>
      <Label>{label}</Label>
      <FormControl>
        <div className="flex rounded-md shadow-xs">
          <Input
            variant="muted"
            className="rounded-r-none"
            placeholder={compactMoney ? 'e.g. 1000, 2k, 4.5k' : undefined}
            value={displayValue}
            onFocus={() => {
              setDraft(String(field.value ?? ''))
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

              field.onChange(parsePlainNumberFieldValue(cleaned))
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
                setDraft(String(defaultValue))
                field.onChange(defaultValue)
                onValueCommit?.(defaultValue)
              }}
            >
              <RotateCw size={16} />
            </Button>
          )}
        </div>
      </FormControl>
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
  compactMoney = false
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
      />
    )}
  />
)
