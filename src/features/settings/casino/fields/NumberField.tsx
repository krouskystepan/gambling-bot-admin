'use client'

import { RotateCw } from 'lucide-react'
import { Path, UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TCasinoSettingsValues } from '@/types/types'

type Props = {
  name: Path<TCasinoSettingsValues>
  label: string
  defaultValue?: number
  form: UseFormReturn<TCasinoSettingsValues>
}

export const NumberField = ({ name, label, defaultValue, form }: Props) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <Label>{label}</Label>
        <FormControl>
          <div className="flex rounded-md shadow-xs">
            <Input
              className="bg-muted rounded-r-none border-transparent shadow-none"
              value={String(field.value ?? '')}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.]/g, '')
                field.onChange(cleaned)
              }}
              onBlur={(e) => {
                const value = e.target.value
                field.onChange(value === '' ? undefined : Number(value))
                field.onBlur()
              }}
            />
            {defaultValue !== undefined && (
              <Button
                type="button"
                variant="ghost"
                className="bg-muted text-destructive/60 hover:text-destructive w-9 rounded-none rounded-e-md"
                onClick={() => field.onChange(defaultValue)}
              >
                <RotateCw size={16} />
              </Button>
            )}
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)
