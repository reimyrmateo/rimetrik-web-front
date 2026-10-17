import type { QueryParams, PagedResult } from '@/core/api/apiTypes'
import { http } from '@/core/api/httpClient'
import type {
  CreateUserPayload,
  PermissionInfo,
  Role,
  RolePayload,
  UpdateUserPayload,
  UserDetails,
  UserSummary,
} from '@/features/users/userTypes'

export const USERS_KEY = 'users'
export const ROLES_KEY = 'roles'
export const PERMISSIONS_KEY = 'permissions'

export const usersApi = {
  list: async (query: QueryParams, signal?: AbortSignal) =>
    (await http.get<PagedResult<UserSummary>>('/users', query, signal)).data,
  get: async (id: number, signal?: AbortSignal) =>
    (await http.get<UserDetails>(`/users/${id}`, undefined, signal)).data,
  create: (payload: CreateUserPayload) => http.post<UserDetails>('/users', payload),
  update: (id: number, payload: UpdateUserPayload) => http.put<UserDetails>(`/users/${id}`, payload),
  setRoles: (id: number, roleIds: number[]) =>
    http.put<UserDetails>(`/users/${id}/roles`, { role_ids: roleIds }),
  activate: (id: number) => http.post<UserDetails>(`/users/${id}/activate`),
  deactivate: (id: number) => http.post<UserDetails>(`/users/${id}/deactivate`),
  resetPassword: (id: number, newPassword: string) =>
    http.post<UserDetails>(`/users/${id}/reset-password`, { new_password: newPassword }),
}

export const rolesApi = {
  list: async (signal?: AbortSignal) => (await http.get<Role[]>('/roles', undefined, signal)).data,
  create: (payload: RolePayload) => http.post<Role>('/roles', payload),
  update: (id: number, payload: RolePayload & { row_version: string }) =>
    http.put<Role>(`/roles/${id}`, payload),
  remove: (id: number) => http.delete<null>(`/roles/${id}`),
}

export const permissionsApi = {
  list: async (signal?: AbortSignal) =>
    (await http.get<PermissionInfo[]>('/permissions', undefined, signal)).data,
}
