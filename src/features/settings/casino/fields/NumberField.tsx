'use client'

import { RotateCw } from 'lucide-react'
import { useState } from 'react'
import { Path, type ControllerRenderProps } from 'react-hook-form'

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
}

const parseNumberFieldValue = (raw: string): number => {
  if (raw === '') return 0
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? 0 : parsed
}

type NumberFieldInputProps = {
  field: ControllerRenderProps<TCasinoSettingsInput, Path<TCasinoSettingsInput>>
  label: string
  defaultValue?: number
  onValueCommit?: (value: number) => void
}

const NumberFieldInput = ({
  field,
  label,
  defaultValue,
  onValueCommit
}: NumberFieldInputProps) => {
  const [draft, setDraft] = useState(() => String(field.value ?? ''))
  const [isFocused, setIsFocused] = useState(false)
  const displayValue = isFocused ? draft : String(field.value ?? '')

  const commit = (raw: string) => {
    const parsed = parseNumberFieldValue(raw)
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
            value={displayValue}
            onFocus={() => {
              setDraft(String(field.value ?? ''))
              setIsFocused(true)
            }}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9.]/g, '')
              setDraft(cleaned)

              if (cleaned !== '' && !cleaned.endsWith('.')) {
                field.onChange(parseNumberFieldValue(cleaned))
              }
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
  onValueCommit
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
      />
    )}
  />
)
