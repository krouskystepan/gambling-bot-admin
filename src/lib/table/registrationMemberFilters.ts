import type { SearchableUserOption } from '@/components/table/SearchableUserFilter'
import type { UserRegistrationFilter } from '@/features/manage/users/useUsers'

export const registrationFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'registered', label: 'Registered' },
  { value: 'not_registered', label: 'Not Registered' }
] as const

export function filterMembersByRegistration(
  members: SearchableUserOption[],
  registration: UserRegistrationFilter,
  registeredUserIds: ReadonlySet<string>
): SearchableUserOption[] {
  if (registration === 'all') {
    return members
  }

  if (registration === 'registered') {
    return members.filter((member) => registeredUserIds.has(member.userId))
  }

  return members.filter((member) => !registeredUserIds.has(member.userId))
}

export function isMemberCompatibleWithRegistration(
  userId: string,
  registration: UserRegistrationFilter,
  registeredUserIds: ReadonlySet<string>
): boolean {
  if (registration === 'all') {
    return true
  }

  const isRegistered = registeredUserIds.has(userId)

  return registration === 'registered' ? isRegistered : !isRegistered
}

export function getVisibleRegistrationOptions(
  selectedUserId: string | undefined,
  registeredUserIds: ReadonlySet<string>
) {
  if (!selectedUserId) {
    return registrationFilterOptions
  }

  const isRegistered = registeredUserIds.has(selectedUserId)

  if (isRegistered) {
    return registrationFilterOptions.filter(
      (option) => option.value !== 'not_registered'
    )
  }

  return registrationFilterOptions.filter(
    (option) => option.value !== 'registered'
  )
}
