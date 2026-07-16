import type { SystemHealthData } from '@/actions/database/systemHealth.action'
import type { SetupHealthCheck } from '@/lib/overview/setupHealth'

const HOUR = 60 * 60 * 1000

export function getDemoSystemHealthData(): SystemHealthData {
  const pendingAtm = 3
  const endedPredictions = 1
  const needsAttention = pendingAtm + endedPredictions

  return {
    needsAttention,
    summary: {
      needsAttention,
      pendingAtm,
      staleBlackjack: 0,
      predictionsAwaitingAction: endedPredictions
    },
    atm: {
      rows: [
        {
          id: 'pending',
          label: 'Pending requests',
          count: pendingAtm,
          severity: 'attention',
          href: '/present/atm-queue?filterStatus=pending',
          tooltip: 'Deposit and withdraw requests awaiting staff action'
        },
        {
          id: 'stale-pending',
          label: 'Stale pending (>24h)',
          count: 0,
          severity: 'ok',
          tooltip: 'Pending requests older than 24 hours'
        }
      ],
      items: [
        {
          userId: '100000000000000004',
          title: 'Deposit · $1,500',
          subtitle: '2h ago',
          adminHref: '/present/users/100000000000000004',
          ageMs: 2 * HOUR
        },
        {
          userId: '100000000000000009',
          title: 'Withdraw · $800',
          subtitle: '5h ago',
          adminHref: '/present/users/100000000000000009',
          ageMs: 5 * HOUR
        },
        {
          userId: '100000000000000013',
          title: 'Deposit · $2,000',
          subtitle: '9h ago',
          adminHref: '/present/users/100000000000000013',
          ageMs: 9 * HOUR
        }
      ]
    },
    blackjack: {
      rows: [
        {
          id: 'active',
          label: 'Active games',
          count: 2,
          severity: 'ok',
          tooltip: 'In-progress blackjack sessions'
        },
        {
          id: 'stale',
          label: 'Stale games (>24h)',
          count: 0,
          severity: 'ok',
          tooltip: 'Games with no update for 24+ hours'
        }
      ],
      items: []
    },
    predictions: {
      rows: [
        {
          id: 'active',
          label: 'Active (not overdue)',
          count: 2,
          severity: 'ok',
          tooltip: 'Open predictions before autolock deadline'
        },
        {
          id: 'overdue-autolock',
          label: 'Overdue autolock',
          count: 0,
          severity: 'ok',
          tooltip: 'Active predictions past their autolock time'
        },
        {
          id: 'ended',
          label: 'Awaiting payout',
          count: endedPredictions,
          severity: 'attention',
          tooltip: 'Ended predictions waiting for /prediction payout'
        },
        {
          id: 'stuck-paying',
          label: 'Stuck paying (>10m)',
          count: 0,
          severity: 'ok',
          tooltip: 'Paying status with no update for 10+ minutes'
        }
      ],
      items: [
        {
          title: 'Will BTC close above $80k this Friday?',
          subtitle: 'Awaiting payout · 3h ago',
          ageMs: 3 * HOUR
        }
      ]
    }
  }
}

export function getDemoSetupHealthChecks(): SetupHealthCheck[] {
  const base = '/present'
  return [
    {
      id: 'atm-actions',
      label: 'ATM actions channel',
      ok: true,
      href: `${base}/channel-settings`
    },
    {
      id: 'atm-logs',
      label: 'ATM logs channel',
      ok: true,
      href: `${base}/channel-settings`
    },
    {
      id: 'manager-role',
      label: 'Manager role',
      ok: true,
      href: `${base}/moderation-settings`
    },
    {
      id: 'casino-channels',
      label: 'Casino channels',
      ok: true,
      href: `${base}/channel-settings`
    },
    {
      id: 'vip-owner-role',
      label: 'VIP owner role',
      ok: true,
      href: `${base}/vip-settings`
    },
    {
      id: 'vip-member-role',
      label: 'VIP member role',
      ok: true,
      href: `${base}/vip-settings`
    },
    {
      id: 'vip-category',
      label: 'VIP category',
      ok: false,
      href: `${base}/vip-settings`
    },
    {
      id: 'rtp-slots',
      label: 'Slots RTP out of range (103.4%)',
      ok: false,
      warning: true,
      rtpStatus: 'high',
      href: `${base}/casino-settings`
    }
  ]
}
