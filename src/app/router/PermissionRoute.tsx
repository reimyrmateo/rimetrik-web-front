import { ShieldAlert } from 'lucide-react'
import { Outlet } from 'react-router'
import { useSession } from '@/core/auth/useSession'
import type { PermissionRequirement } from '@/core/security/can'
import { EmptyState } from '@/shared/components/EmptyState'

export function ForbiddenState() {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="No tiene permiso para ver esta sección"
      description="Si necesita acceso, solicítelo a un administrador del sistema."
    />
  )
}

export function PermissionRoute({ requires }: { requires: PermissionRequirement }) {
  const { can } = useSession()

  return can(requires) ? <Outlet /> : <ForbiddenState />
}
