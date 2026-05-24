import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  TTransaction
} from 'gambling-bot-shared'

const TYPE_BADGE_STYLES: Record<TTransaction['type'], string> = {
  deposit: 'bg-emerald-500 text-white',
  withdraw: 'bg-rose-500 text-white',
  bet: 'bg-indigo-500 text-white',
  win: 'bg-green-700 text-white',
  refund: 'bg-violet-500 text-white',
  bonus: 'bg-amber-500 text-white',
  vip: 'bg-pink-500 text-white'
}

const SOURCE_BADGE_STYLES: Record<TTransaction['source'], string> = {
  casino: 'bg-orange-500 text-white',
  command: 'bg-cyan-500 text-white',
  manual: 'bg-gray-500 text-white',
  system: 'bg-slate-700 text-white',
  web: 'bg-sky-500 text-white'
}

export const typeBadgeMap = Object.fromEntries(
  TRANSACTION_TYPES.map((type) => [type, TYPE_BADGE_STYLES[type]])
) as Record<TTransaction['type'], string>

export const sourceBadgeMap = Object.fromEntries(
  TRANSACTION_SOURCES.map((source) => [source, SOURCE_BADGE_STYLES[source]])
) as Record<TTransaction['source'], string>
