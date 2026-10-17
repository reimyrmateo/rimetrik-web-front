import { z } from 'zod'
import type { Role } from '@/features/users/userTypes'
import { optionalText, requiredText } from '@/shared/validations/common'

export const roleSchema = z.object({
  name: requiredText('El nombre', 60),
  description: optionalText('La descripción', 300),
  permissions: z.array(z.string()).min(1, 'Asigne al menos un permiso al rol.'),
})

export type RoleValues = z.input<typeof roleSchema>

export const ROLE_FIELDS = ['name', 'description', 'permissions'] as const

export function roleDefaults(role?: Role): RoleValues {
  return {
    name: role?.name ?? '',
    description: role?.description ?? '',
    permissions: role ? [...role.permissions] : [],
  }
}
