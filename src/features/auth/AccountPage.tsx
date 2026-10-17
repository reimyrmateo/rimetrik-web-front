import { useSession } from '@/core/auth/useSession'
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm'
import { Alert } from '@/shared/components/Alert'
import { Badge } from '@/shared/components/Badge'
import { PageHeader } from '@/shared/components/PageHeader'

export function AccountPage() {
  const { user } = useSession()

  if (!user) {
    return null
  }

  return (
    <>
      <PageHeader title="Mi cuenta" description="Sus datos de acceso y la seguridad de su sesión." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <section
          className="rounded-card border border-line bg-surface p-6 shadow-card"
          aria-labelledby="perfil"
        >
          <h2 id="perfil" className="text-base font-semibold text-ink">
            Perfil
          </h2>
          <dl className="mt-4 flex flex-col gap-4 text-sm">
            <div>
              <dt className="text-[13px] text-ink-muted">Nombre</dt>
              <dd className="mt-0.5 font-medium text-ink">{user.full_name}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-muted">Correo</dt>
              <dd className="mt-0.5 font-medium break-all text-ink">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-muted">Roles</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge key={role} tone="brand">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-ink-muted">Sin roles asignados</span>
                )}
              </dd>
            </div>
          </dl>
        </section>
        <section
          className="rounded-card border border-line bg-surface p-6 shadow-card"
          aria-labelledby="clave"
        >
          <h2 id="clave" className="text-base font-semibold text-ink">
            Cambiar contraseña
          </h2>
          <Alert tone="info" className="mt-4 mb-5">
            Al cambiarla se cerrarán todas sus sesiones abiertas, incluida esta.
          </Alert>
          <ChangePasswordForm email={user.email} />
        </section>
      </div>
    </>
  )
}
