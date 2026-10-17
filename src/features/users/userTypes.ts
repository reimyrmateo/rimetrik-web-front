import type { Versioned } from '@/shared/types/common'

export interface UserSummary {
  id: number
  full_name: string
  email: string
  is_active: boolean
  roles: string[]
  last_login_at: string | null
}

export interface UserRole {
  id: number
  name: string
}

export interface UserDetails extends Versioned {
  id: number
  full_name: string
  email: string
  is_active: boolean
  roles: UserRole[]
  last_login_at: string | null
  lockout_end: string | null
  created_at: string
  updated_at: string | null
}

export interface CreateUserPayload {
  full_name: string
  email: string
  password: string
  role_ids: number[]
}

export interface UpdateUserPayload extends Versioned {
  full_name: string
  email: string
}

export interface Role extends Versioned {
  id: number
  name: string
  description: string | null
  is_system: boolean
  permissions: string[]
  user_count: number
}

export interface RolePayload {
  name: string
  description: string | null
  permissions: string[]
}

export interface PermissionInfo {
  code: string
  description: string | null
}

export interface PermissionGroup {
  label: string
  permissions: PermissionInfo[]
}

const GROUPS: readonly { label: string; prefixes: readonly string[] }[] = [
  { label: 'Usuarios y seguridad', prefixes: ['users', 'roles', 'audit'] },
  { label: 'Proyectos', prefixes: ['projects'] },
  { label: 'Catálogos y cuentas', prefixes: ['catalogs', 'bank_accounts'] },
  { label: 'Presupuestos y adicionales', prefixes: ['budgets', 'change_orders'] },
  { label: 'Ingresos', prefixes: ['collections'] },
  { label: 'Gastos y pagos', prefixes: ['costs', 'payments', 'payroll'] },
  { label: 'Documentos y resumen', prefixes: ['documents', 'dashboard'] },
]

export function groupPermissions(permissions: readonly PermissionInfo[]): PermissionGroup[] {
  const groups = GROUPS.map((group) => ({
    label: group.label,
    prefixes: group.prefixes,
    permissions: [] as PermissionInfo[],
  }))
  const others: PermissionInfo[] = []

  for (const permission of permissions) {
    const prefix = permission.code.split('.')[0] ?? ''
    const group = groups.find((candidate) => candidate.prefixes.includes(prefix))

    if (group) {
      group.permissions.push(permission)
    } else {
      others.push(permission)
    }
  }

  return [
    ...groups
      .filter((group) => group.permissions.length > 0)
      .map(({ label, permissions: items }) => ({ label, permissions: items })),
    ...(others.length > 0 ? [{ label: 'Otros', permissions: others }] : []),
  ]
}
