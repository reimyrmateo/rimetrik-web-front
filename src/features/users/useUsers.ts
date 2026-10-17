import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  permissionsApi,
  PERMISSIONS_KEY,
  rolesApi,
  ROLES_KEY,
  usersApi,
  USERS_KEY,
} from '@/features/users/usersApi'
import type { CreateUserPayload, RolePayload, UpdateUserPayload } from '@/features/users/userTypes'
import { useCatalogList } from '@/shared/hooks/useCatalogList'

function useIdentityInvalidation() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] }),
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] }),
    ])
}

export function useUsers() {
  return useCatalogList(USERS_KEY, usersApi.list)
}

export function useUserDetails(id: number | null) {
  return useQuery({
    queryKey: [USERS_KEY, 'detail', id],
    queryFn: ({ signal }) => usersApi.get(id ?? 0, signal),
    enabled: id !== null,
    staleTime: 0,
  })
}

export function useUserMutations() {
  const invalidate = useIdentityInvalidation()

  return {
    create: useMutation({
      mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
        usersApi.update(id, payload),
      onSuccess: invalidate,
    }),
    setRoles: useMutation({
      mutationFn: ({ id, roleIds }: { id: number; roleIds: number[] }) => usersApi.setRoles(id, roleIds),
      onSuccess: invalidate,
    }),
    setActive: useMutation({
      mutationFn: ({ id, active }: { id: number; active: boolean }) =>
        active ? usersApi.activate(id) : usersApi.deactivate(id),
      onSuccess: invalidate,
    }),
    resetPassword: useMutation({
      mutationFn: ({ id, password }: { id: number; password: string }) =>
        usersApi.resetPassword(id, password),
      onSuccess: invalidate,
    }),
  }
}

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: [ROLES_KEY, 'list'],
    queryFn: ({ signal }) => rolesApi.list(signal),
    enabled,
  })
}

export function usePermissionCatalog(enabled = true) {
  return useQuery({
    queryKey: [PERMISSIONS_KEY],
    queryFn: ({ signal }) => permissionsApi.list(signal),
    enabled,
    staleTime: Infinity,
  })
}

export function useRoleMutations() {
  const invalidate = useIdentityInvalidation()

  return {
    save: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number | null
        payload: RolePayload & { row_version?: string }
      }) =>
        id === null
          ? rolesApi.create(payload)
          : rolesApi.update(id, { ...payload, row_version: payload.row_version ?? '' }),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => rolesApi.remove(id), onSuccess: invalidate }),
  }
}
