import { describe, expect, it } from 'vitest'

import {
  emptySettingsChangeCounts,
  formatSettingsChangeSummary
} from '@/lib/settingsAudit/settingsChangeRows'
import {
  SETTINGS_CHANGE_SECTIONS,
  isSettingsChangeSection
} from '@/lib/settingsAudit/settingsChangeSections'
import {
  channelsSliceFromDoc,
  moderationSliceFromDoc
} from '@/lib/settingsAudit/settingsSlices'

describe('settingsChangeSections', () => {
  it('recognizes known sections', () => {
    for (const section of SETTINGS_CHANGE_SECTIONS) {
      expect(isSettingsChangeSection(section)).toBe(true)
    }
    expect(isSettingsChangeSection('unknown')).toBe(false)
  })
})

describe('settingsChangeRows', () => {
  it('builds empty counts for every section', () => {
    const counts = emptySettingsChangeCounts()
    for (const section of SETTINGS_CHANGE_SECTIONS) {
      expect(counts[section]).toBe(0)
    }
  })

  it('formats change summaries', () => {
    expect(formatSettingsChangeSummary([])).toBe('No field changes')
    expect(formatSettingsChangeSummary(['a'])).toBe('a')
    expect(formatSettingsChangeSummary(['a', 'b', 'c'])).toBe('a, b, c')
    expect(formatSettingsChangeSummary(['a', 'b', 'c', 'd'])).toBe(
      '4 fields changed'
    )
  })
})

describe('settingsSlices', () => {
  it('returns null for missing docs', () => {
    expect(channelsSliceFromDoc(null)).toBeNull()
    expect(channelsSliceFromDoc(undefined)).toBeNull()
    expect(moderationSliceFromDoc(null)).toBeNull()
    expect(moderationSliceFromDoc(undefined)).toBeNull()
  })

  it('maps channel fields with defaults', () => {
    expect(channelsSliceFromDoc({})).toEqual({
      atm: { actions: '', logs: '' },
      casino: { casinoChannelIds: [], winAnnouncementsChannelId: '' },
      prediction: { actions: '', logs: '' },
      raffle: { actions: '', logs: '' },
      workerLogChannelId: ''
    })

    expect(
      channelsSliceFromDoc({
        atmChannelIds: { actions: 'a1', logs: 'l1' },
        casinoChannelIds: ['c1'],
        winAnnouncementsChannelId: 'w1',
        predictionChannelIds: { actions: 'p1', logs: 'p2' },
        raffleChannelIds: { actions: 'r1', logs: 'r2' },
        workerLogChannelId: 'worker'
      })
    ).toEqual({
      atm: { actions: 'a1', logs: 'l1' },
      casino: { casinoChannelIds: ['c1'], winAnnouncementsChannelId: 'w1' },
      prediction: { actions: 'p1', logs: 'p2' },
      raffle: { actions: 'r1', logs: 'r2' },
      workerLogChannelId: 'worker'
    })
  })

  it('maps moderation fields with defaults', () => {
    expect(moderationSliceFromDoc({})).toEqual({
      managerRoleId: '',
      bannedRoleId: ''
    })
    expect(
      moderationSliceFromDoc({
        managerRoleId: 'm1',
        bannedRoleId: 'b1'
      })
    ).toEqual({
      managerRoleId: 'm1',
      bannedRoleId: 'b1'
    })
  })
})
