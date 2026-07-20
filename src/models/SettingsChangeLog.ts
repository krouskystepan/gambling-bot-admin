'server-only'

import { Schema } from 'mongoose'

import { getModel } from '@/lib/db'
import type { SettingsChangeSection } from '@/lib/settingsAudit/settingsChangeSections'

export type TSettingsChangeLog = {
  guildId: string
  changedBy: string
  section: SettingsChangeSection
  before: unknown
  after: unknown
  changedPaths: string[]
  createdAt?: Date
  updatedAt?: Date
}

const SettingsChangeLogSchema = new Schema<TSettingsChangeLog>(
  {
    guildId: { type: String, required: true, index: true },
    changedBy: { type: String, required: true },
    section: {
      type: String,
      required: true,
      enum: [
        'global',
        'channels',
        'moderation',
        'casino',
        'bonus',
        'vip',
        'reset'
      ]
    },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    changedPaths: { type: [String], default: [] }
  },
  { timestamps: true }
)

SettingsChangeLogSchema.index({ guildId: 1, createdAt: -1 })
SettingsChangeLogSchema.index({ guildId: 1, section: 1, createdAt: -1 })
SettingsChangeLogSchema.index({ guildId: 1, changedBy: 1, createdAt: -1 })

export default getModel<TSettingsChangeLog>(
  'SettingsChangeLog',
  SettingsChangeLogSchema
)
