import { Eye, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/core/auth/useSession'
import { PERMISSIONS } from '@/core/constants/permissions'
import { errorMessage } from '@/core/errors/ApiError'
import { RoleForm } from '@/features/users/RoleForm'
import { useRoleMutations, useRoles } from '@/features/users/useUsers'
import type { Role } from '@/features/users/userTypes'
import { Alert } from '@/shared/components/Alert'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable, type Column } from '@/shared/components/DataTable'
import { Modal } from '@/shared/components/Modal'
import { RowActions } from '@/shared/components/RowActions'
import { toast } from '@/shared/components/Toaster'
import { formatNumber } from '@/shared/utils/format'

export function RolesPanel() {
  const { can } = useSession()
  const canManage = can(PERMISSIONS.roles.manage)
  const roles = useRoles()
  const { remove } = useRoleMutations()
  const [editing, setEditing] = useState<Role | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Rol',
      cell: (role) => (
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink">
            {role.name}
            {role.is_system && <Badge tone="info">Sistema</Badge>}
          </p>
          {role.description && <p className="text-[13px] text-ink-muted">{role.description}</p>}
        </div>
      ),
    },
    {
      key: 'permissions',
      header: 'Permisos',
      align: 'right',
      className: 'tabular',
      cell: (role) => formatNumber(role.permissions.length),
    },
    {
      key: 'users',
      header: 'Usuarios',
      align: 'right',
      className: 'tabular',
      hideOnMobile: true,
      cell: (role) => formatNumber(role.user_count),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      className: 'w-16',
      cell: (role) => (
        <RowActions
          label={`Acciones para ${role.name}`}
          actions={[
            {
              label: 'Ver permisos',
              icon: Eye,
              onSelect: () => setEditing(role),
              hidden: canManage && !role.is_system,
            },
            {
              label: 'Editar',
              icon: Pencil,
              onSelect: () => setEditing(role),
              hidden: !canManage || role.is_system,
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              tone: 'danger',
              onSelect: () => setDeleting(role),
              hidden: !canManage || role.is_system || role.user_count > 0,
            },
          ]}
        />
      ),
    },
  ]

  const viewing = editing !== null && editing !== 'new' && (editing.is_system || !canManage) ? editing : null
  const readOnly = viewing !== null
  const title = editing === 'new' ? 'Nuevo rol' : (viewing?.name ?? 'Editar rol')

  return (
    <>
      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted">
            Cada rol agrupa permisos. Un rol con usuarios asignados no puede eliminarse.
          </p>
          {canManage && (
            <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setEditing('new')}>
              Nuevo rol
            </Button>
          )}
        </div>
        {roles.isError ? (
          <Alert tone="danger" className="m-4">
            {errorMessage(roles.error)}
          </Alert>
        ) : (
          <DataTable
            caption="Roles"
            columns={columns}
            rows={roles.data ?? []}
            getRowKey={(role) => role.id}
            loading={roles.isFetching}
            empty={{
              icon: ShieldCheck,
              title: 'Todavía no hay roles',
              description: 'Cree un rol para asignarlo a los usuarios.',
            }}
          />
        )}
      </section>
      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={title}
        {...(readOnly ? {} : { description: 'Los campos con * son obligatorios.' })}
        size="xl"
      >
        {editing !== null && (
          <RoleForm
            {...(editing === 'new' ? {} : { role: editing })}
            readOnly={readOnly}
            onCancel={() => setEditing(null)}
            onSaved={(message) => {
              toast.success(message)
              setEditing(null)
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar rol"
        description={`Se eliminará el rol «${deleting?.name ?? ''}». Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) {
            return
          }

          remove.mutate(deleting.id, {
            onSuccess: (result) => toast.success(result.message),
            onError: (error) => toast.error(errorMessage(error)),
            onSettled: () => setDeleting(null),
          })
        }}
      />
    </>
  )
}
