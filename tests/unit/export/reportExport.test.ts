import { describe, expect, it } from 'vitest'

import {
  guildTaxSummaryToCsv,
  pnlBySourceToCsv,
  staffTaxSummaryToCsv
} from '@/lib/export/reportExport'

const metrics = {
  gamePnL: 10,
  cashFlow: 5,
  betVolume: 100,
  winVolume: 90,
  depositVolume: 50,
  withdrawVolume: 45,
  txCount: 3
}

describe('reportExport', () => {
  it('pnlBySourceToCsv includes source and metric headers', () => {
    const csv = pnlBySourceToCsv([{ source: 'casino', ...metrics }])
    expect(csv).toContain(
      'source,gamePnL,cashFlow,betVolume,winVolume,depositVolume,withdrawVolume,txCount'
    )
    expect(csv).toContain('casino,10,5,100,90,50,45,3')
  })

  it('guildTaxSummaryToCsv shapes period rows', () => {
    const csv = guildTaxSummaryToCsv([{ period: '2026-01', ...metrics }])
    expect(csv.startsWith('period,gamePnL')).toBe(true)
    expect(csv).toContain('2026-01,10,5,100,90,50,45,3')
  })

  it('staffTaxSummaryToCsv includes handler columns', () => {
    const csv = staffTaxSummaryToCsv([
      {
        period: '2026-01',
        handlerId: 'staff-1',
        handlerUsername: 'Alice',
        ...metrics
      }
    ])
    expect(csv).toContain('period,handlerId,handlerUsername,gamePnL')
    expect(csv).toContain('2026-01,staff-1,Alice,10,5,100,90,50,45,3')
  })
})
