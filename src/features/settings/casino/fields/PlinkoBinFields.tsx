'use client'

import { defaultCasinoSettings } from 'gambling-bot-shared/casino'
import {
  PLINKO_EDITABLE_BINS,
  getPlinkoMirrorBin
} from 'gambling-bot-shared/casino'
import { Path } from 'react-hook-form'

import { TCasinoSettingsForm, TCasinoSettingsInput } from '@/types/types'

import { NumberField } from './NumberField'

type Props = {
  form: TCasinoSettingsForm
}

const BIN_LABELS: Record<(typeof PLINKO_EDITABLE_BINS)[number], string> = {
  1: 'Bin 1 (same as Bin 9)',
  2: 'Bin 2 (same as Bin 8)',
  3: 'Bin 3 (same as Bin 7)',
  4: 'Bin 4 (same as Bin 6)',
  5: 'Bin 5 (center)'
}

export function PlinkoBinFields({ form }: Props) {
  const defaults = defaultCasinoSettings.plinko.binMultipliers as Record<
    string,
    number
  >

  const syncMirrorBins = (bin: number, value: number | undefined) => {
    if (bin > 4 || value === undefined) return

    const mirror = getPlinkoMirrorBin(bin)
    form.setValue(
      `plinko.binMultipliers.${mirror}` as Path<TCasinoSettingsInput>,
      value,
      { shouldDirty: true, shouldValidate: true }
    )
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
      {PLINKO_EDITABLE_BINS.map((bin) => (
        <NumberField
          key={bin}
          form={form}
          name={`plinko.binMultipliers.${bin}` as Path<TCasinoSettingsInput>}
          label={BIN_LABELS[bin]}
          defaultValue={defaults[String(bin)]}
          onValueCommit={(value) => syncMirrorBins(bin, value)}
        />
      ))}
    </div>
  )
}
