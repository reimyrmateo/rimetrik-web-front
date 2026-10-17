import { Navigate, useLocation, useNavigate } from 'react-router'
import { useSessionStore } from '@/app/store/sessionStore'
import { ROUTES } from '@/core/constants/routes'
import { useSession } from '@/core/auth/useSession'
import { LoginForm } from '@/features/auth/LoginForm'
import { Alert } from '@/shared/components/Alert'

function safeRedirect(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from

  if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && from !== ROUTES.login) {
    return from
  }

  return ROUTES.home
}

export function LoginPage() {
  const { status } = useSession()
  const notice = useSessionStore((state) => state.notice)
  const clearNotice = useSessionStore((state) => state.clearNotice)
  const location = useLocation()
  const navigate = useNavigate()
  const target = safeRedirect(location.state)

  if (status === 'authenticated') {
    return <Navigate to={target} replace />
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <span className="flex size-10 items-center justify-center rounded-control bg-navy-900 text-lg font-black text-white">
          R
        </span>
        <span className="text-lg font-extrabold tracking-wide text-ink">RIMETRIK</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Iniciar sesión</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">Ingrese con el correo y la contraseña de su cuenta.</p>
      {notice && (
        <Alert tone="info" className="mb-4">
          {notice}
        </Alert>
      )}
      <LoginForm
        onSuccess={() => {
          clearNotice()
          void navigate(target, { replace: true })
        }}
      />
    </div>
  )
}
