/** Sync staff check when role IDs are already known (e.g. from list members). */
export function isGuildStaffFromRoles({
  userId,
  roles,
  managerRoleId,
  adminRoleIds,
  ownerId
}: {
  userId: string
  roles: string[]
  managerRoleId: string | null | undefined
  adminRoleIds: string[]
  ownerId?: string | null
}): boolean {
  if (ownerId && userId === ownerId) {
    return true
  }

  if (managerRoleId && roles.includes(managerRoleId.toString())) {
    return true
  }

  return roles.some((roleId) => adminRoleIds.includes(roleId))
}
