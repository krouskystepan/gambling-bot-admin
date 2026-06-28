export const BADGE_COLORS = {
  emerald: '#10B981',
  coral: '#FF6B6B',
  blue: '#2563EB',
  teal: '#059669',
  purple: '#A855F7',
  gold: '#EAB308',
  pink: '#EC4899',
  cyan: '#06B6D4',
  orange: '#F59E0B',
  red: '#EF4444',
  gray: '#6B7280',
  amber: '#D97706',
  burgundy: '#991B1B'
} as const

export type BadgeColor = keyof typeof BADGE_COLORS

const BADGE_FILLED_CLASSES = {
  emerald: 'border-transparent bg-[#10B981] text-white',
  coral: 'border-transparent bg-[#FF6B6B] text-white',
  blue: 'border-transparent bg-[#2563EB] text-white',
  teal: 'border-transparent bg-[#059669] text-white',
  purple: 'border-transparent bg-[#A855F7] text-white',
  gold: 'border-transparent bg-[#EAB308] text-gray-900',
  pink: 'border-transparent bg-[#EC4899] text-white',
  cyan: 'border-transparent bg-[#06B6D4] text-white',
  orange: 'border-transparent bg-[#F59E0B] text-white',
  red: 'border-transparent bg-[#EF4444] text-white',
  gray: 'border-transparent bg-[#6B7280] text-white',
  amber: 'border-transparent bg-[#D97706] text-white',
  burgundy: 'border-transparent bg-[#991B1B] text-white'
} as const satisfies Record<BadgeColor, string>

const BADGE_OUTLINE_CLASSES = {
  emerald:
    'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981] dark:border-[#10B981]/50 dark:bg-[#10B981]/15 dark:text-[#34D399]',
  coral:
    'border-[#FF6B6B]/40 bg-[#FF6B6B]/10 text-[#FF6B6B] dark:border-[#FF6B6B]/50 dark:bg-[#FF6B6B]/15 dark:text-[#FCA5A5]',
  blue: 'border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB] dark:border-[#2563EB]/50 dark:bg-[#2563EB]/15 dark:text-[#60A5FA]',
  teal: 'border-[#059669]/40 bg-[#059669]/10 text-[#059669] dark:border-[#059669]/50 dark:bg-[#059669]/15 dark:text-[#2DD4BF]',
  purple:
    'border-[#A855F7]/40 bg-[#A855F7]/10 text-[#A855F7] dark:border-[#A855F7]/50 dark:bg-[#A855F7]/15 dark:text-[#C084FC]',
  gold: 'border-[#EAB308]/40 bg-[#EAB308]/10 text-[#EAB308] dark:border-[#EAB308]/50 dark:bg-[#EAB308]/15 dark:text-[#FDE047]',
  pink: 'border-[#EC4899]/40 bg-[#EC4899]/10 text-[#EC4899] dark:border-[#EC4899]/50 dark:bg-[#EC4899]/15 dark:text-[#F472B6]',
  cyan: 'border-[#06B6D4]/40 bg-[#06B6D4]/10 text-[#06B6D4] dark:border-[#06B6D4]/50 dark:bg-[#06B6D4]/15 dark:text-[#22D3EE]',
  orange:
    'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B] dark:border-[#F59E0B]/50 dark:bg-[#F59E0B]/15 dark:text-[#FBBF24]',
  red: 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444] dark:border-[#EF4444]/50 dark:bg-[#EF4444]/15 dark:text-[#F87171]',
  gray: 'border-[#6B7280]/40 bg-[#6B7280]/10 text-[#6B7280] dark:border-[#6B7280]/50 dark:bg-[#6B7280]/15 dark:text-[#9CA3AF]',
  amber:
    'border-[#D97706]/40 bg-[#D97706]/10 text-[#D97706] dark:border-[#D97706]/50 dark:bg-[#D97706]/15 dark:text-[#FBBF24]',
  burgundy:
    'border-[#991B1B]/40 bg-[#991B1B]/10 text-[#991B1B] dark:border-[#991B1B]/50 dark:bg-[#991B1B]/15 dark:text-[#F87171]'
} as const satisfies Record<BadgeColor, string>

export function badgeFilledClass(color: BadgeColor): string {
  return BADGE_FILLED_CLASSES[color]
}

export function badgeOutlineClass(color: BadgeColor): string {
  return BADGE_OUTLINE_CLASSES[color]
}
