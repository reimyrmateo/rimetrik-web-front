import type { CurrentUser } from '@/core/auth/authTypes'
import type { Permission } from '@/core/constants/permissions'

export type PermissionRequirement = Permission | readonly Permission[]

export function can(user: CurrentUser | null, requirement: PermissionRequirement | undefined): boolean {
  if (requirement === undefined) {
    return user !== null
  }

  if (user === null) {
    return false
  }

  const required: readonly Permission[] = typeof requirement === 'string' ? [requirement] : requirement

  return required.length === 0 || required.some((permission) => user.permissions.includes(permission))
}
