import { Compass } from 'lucide-react'
import { createBrowserRouter, Link, Navigate } from 'react-router'
import { PermissionRoute } from '@/app/router/PermissionRoute'
import { FullPageLoader, ProtectedRoute } from '@/app/router/ProtectedRoute'
import { BANK_ACCOUNT_READ_PERMISSIONS, PERMISSIONS } from '@/core/constants/permissions'
import { ROUTES } from '@/core/constants/routes'
import { useSession } from '@/core/auth/useSession'
import { AccountPage } from '@/features/auth/AccountPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { NAVIGATION } from '@/layouts/navigation'
import { EmptyState } from '@/shared/components/EmptyState'

function HomeRedirect() {
  const { can } = useSession()
  const first = NAVIGATION.flatMap((group) => group.items).find((item) => item.ready && can(item.requires))

  return <Navigate to={first?.to ?? ROUTES.account} replace />
}

function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="Página no encontrada"
      description="La dirección no existe o la sección todavía no está disponible."
      action={
        <Link to={ROUTES.home} className="text-sm font-semibold text-brand-700 hover:underline">
          Volver al inicio
        </Link>
      }
    />
  )
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: ROUTES.login, element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    hydrateFallbackElement: <FullPageLoader />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: ROUTES.account, element: <AccountPage /> },
          {
            element: <PermissionRoute requires={PERMISSIONS.catalogs.view} />,
            children: [
              {
                path: ROUTES.clients,
                lazy: async () => ({
                  Component: (await import('@/features/clients/ClientsPage')).ClientsPage,
                }),
              },
              {
                path: ROUTES.suppliers,
                lazy: async () => ({
                  Component: (await import('@/features/suppliers/SuppliersPage')).SuppliersPage,
                }),
              },
              {
                path: ROUTES.contractors,
                lazy: async () => ({
                  Component: (await import('@/features/contractors/ContractorsPage')).ContractorsPage,
                }),
              },
            ],
          },
          {
            element: <PermissionRoute requires={[PERMISSIONS.users.view, PERMISSIONS.roles.view]} />,
            children: [
              {
                path: ROUTES.users,
                lazy: async () => ({ Component: (await import('@/features/users/UsersPage')).UsersPage }),
              },
            ],
          },
          {
            element: (
              <PermissionRoute requires={[PERMISSIONS.catalogs.view, ...BANK_ACCOUNT_READ_PERMISSIONS]} />
            ),
            children: [
              {
                path: ROUTES.settings,
                lazy: async () => ({
                  Component: (await import('@/features/settings/SettingsPage')).SettingsPage,
                }),
              },
            ],
          },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
