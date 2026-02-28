'use client'

import {
  defaultCasinoSettings,
  readableGameValueNames
} from 'gambling-bot-shared'
import { Path, UseFormReturn, useWatch } from 'react-hook-form'

import { getReadableName } from '@/lib/utils'
import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

import { GAME_RECORD_FIELDS, GameWithRecords } from './config'
import { NumberField } from './fields/NumberField'
import { RecordFields } from './fields/RecordFields'

type Props = {
  game: keyof TCasinoSettingsValues
  form: UseFormReturn<TCasinoSettingsOutput>
}

const GameSection = ({ game, form }: Props) => {
  const numericKeys = (
    Object.keys(defaultCasinoSettings[game]) as Array<
      keyof (typeof defaultCasinoSettings)[typeof game]
    >
  ).filter((key) => typeof defaultCasinoSettings[game][key] === 'number')

  const settings = useWatch({
    control: form.control,
    name: game
  })

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {numericKeys.map((key) => (
          <NumberField
            key={String(key)}
            form={form}
            name={`${game}.${key}` as Path<TCasinoSettingsValues>}
            label={getReadableName(String(key), readableGameValueNames)}
            defaultValue={
              defaultCasinoSettings[game][
                key as keyof (typeof defaultCasinoSettings)[typeof game]
              ] as number
            }
          />
        ))}
      </div>

      {game in GAME_RECORD_FIELDS &&
        GAME_RECORD_FIELDS[game as GameWithRecords].map((recordKey) => (
          <RecordFields
            key={recordKey}
            game={game as GameWithRecords}
            recordKey={recordKey}
            values={
              settings?.[recordKey as keyof typeof settings] as Record<
                string,
                number
              >
            }
            form={form}
          />
        ))}
    </>
  )
}

export default GameSection
