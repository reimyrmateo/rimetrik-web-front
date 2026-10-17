import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useSessionStore } from '@/app/store/sessionStore'
import { configureSessionHooks } from '@/core/api/httpClient'
import { authApi } from '@/core/auth/authApi'
import type { ChangePasswordPayload, LoginPayload } from '@/core/auth/authTypes'
import { can, type PermissionRequirement } from '@/core/security/can'

export const SESSION_EXPIRED_NOTICE = 'Su sesión expiró. Inicie sesión de nuevo para continuar.'
export const PASSWORD_CHANGED_NOTICE = 'Contraseña actualizada. Inicie sesión con la nueva contraseña.'

export function useSession() {
  const status = useSessionStore((state) => state.status)
  const user = useSessionStore((state) => state.user)
  const allows = useCallback((requirement?: PermissionRequirement) => can(user, requirement), [user])

  return { status, user, can: allows }
}

export function useSessionBootstrap(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const { signIn, signOut } = useSessionStore.getState()

    configureSessionHooks({
      onRefreshed: signIn,
      onExpired: () => {
        queryClient.clear()
        signOut(SESSION_EXPIRED_NOTICE)
      },
    })

    void authApi.restore().then((restored) => {
      if (!restored) {
        useSessionStore.getState().signOut()
      }
    })

    return () => configureSessionHooks(null)
  }, [queryClient])
}

export function useLogin() {
  const signIn = useSessionStore((state) => state.signIn)

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: signIn,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const signOut = useSessionStore((state) => state.signOut)

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      queryClient.clear()
      signOut()
    },
  })
}

export function useChangePassword() {
  const queryClient = useQueryClient()
  const signOut = useSessionStore((state) => state.signOut)

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: () => {
      queryClient.clear()
      signOut(PASSWORD_CHANGED_NOTICE)
    },
  })
}
