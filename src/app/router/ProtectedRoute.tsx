import { Navigate, Outlet, useLocation } from 'react-router'
import { ROUTES } from '@/core/constants/routes'
import { useSession } from '@/core/auth/useSession'
import { Spinner } from '@/shared/components/Spinner'

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas text-brand-600">
      <Spinner label="Verificando la sesión" className="[&>span:first-child]:size-6" />
    </div>
  )
}

export function ProtectedRoute() {
  const { status } = useSession()
  const location = useLocation()

  if (status === 'checking') {
    return <FullPageLoader />
  }

  if (status === 'anonymous') {
    return <Navigate to={ROUTES.login} replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  return <Outlet />
}
