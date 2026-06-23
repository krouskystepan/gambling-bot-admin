type FacetOption<T extends string> = {
  value: string
  label: string
  realValue: T
}

export function getVisibleFacetOptions<T extends string>(
  options: FacetOption<T>[],
  selected: FacetOption<T>[],
  counts: Record<T, number>
): FacetOption<T>[] {
  return options.filter((option) => {
    const isSelected = selected.some(
      (entry) => entry.realValue === option.realValue
    )
    const count = counts[option.realValue] ?? 0

    return isSelected || count > 0
  })
}

export function pruneFacetValues<T extends string>(
  values: T[] | undefined,
  counts: Record<T, number>
): T[] | undefined {
  if (!values?.length) {
    return undefined
  }

  const pruned = values.filter((value) => (counts[value] ?? 0) > 0)

  return pruned.length ? pruned : undefined
}

export function canSelectFacetValue<T extends string>(
  value: T,
  counts: Record<T, number>
) {
  return (counts[value] ?? 0) > 0
}

export function filterMembersByEntityFacet<T extends { userId: string }>(
  members: T[],
  selectedUserId: string | undefined,
  facetCounts: Record<string, number>,
  restrict: boolean
): T[] {
  if (!restrict) {
    return members
  }

  return members.filter(
    (member) =>
      member.userId === selectedUserId || (facetCounts[member.userId] ?? 0) > 0
  )
}

export function isEntityCompatibleWithFacet(
  userId: string,
  facetCounts: Record<string, number>,
  restrict: boolean
): boolean {
  if (!restrict) {
    return true
  }

  return (facetCounts[userId] ?? 0) > 0
}
