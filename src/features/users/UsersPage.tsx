import { KeyRound, Pencil, Plus, Power, UserCog } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/core/auth/useSession'
import { PERMISSIONS } from '@/core/constants/permissions'
import { errorMessage } from '@/core/errors/ApiError'
import { RolesPanel } from '@/features/users/RolesPanel'
import { ResetPasswordForm, UserForm } from '@/features/users/UserForm'
import { useUserDetails, useUserMutations, useUsers } from '@/features/users/useUsers'
import type { UserSummary } from '@/features/users/userTypes'
import { Alert } from '@/shared/components/Alert'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable, type Column } from '@/shared/components/DataTable'
import { Modal } from '@/shared/components/Modal'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/components/Pagination'
import { RowActions } from '@/shared/components/RowActions'
import { SearchInput } from '@/shared/components/SearchInput'
import { Spinner } from '@/shared/components/Spinner'
import { StatusFilter } from '@/shared/components/StatusFilter'
import { Tabs, type TabItem } from '@/shared/components/Tabs'
import { toast } from '@/shared/components/Toaster'
import { formatDateTime } from '@/shared/utils/format'

function EditUserModalBody({ id, onClose }: { id: number; onClose: () => void }) {
  const details = useUserDetails(id)

  if (details.isPending) {
    return (
      <div className="flex justify-center py-10">
        <Spinner label="Cargando usuario" />
      </div>
    )
  }

  if (details.isError) {
    return <Alert tone="danger">{errorMessage(details.error)}</Alert>
  }

  return (
    <UserForm
      user={details.data}
      onCancel={onClose}
      onSaved={(message) => {
        toast.success(message)
        onClose()
      }}
    />
  )
}

function UsersPanel() {
  const { can, user: me } = useSession()
  const canManage = can(PERMISSIONS.users.manage)
  const list = useUsers()
  const { setActive } = useUserMutations()
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [resetting, setResetting] = useState<UserSummary | null>(null)
  const [deactivating, setDeactivating] = useState<UserSummary | null>(null)
  const data = list.query.data

  const activate = (target: UserSummary) =>
    setActive.mutate(
      { id: target.id, active: true },
      {
        onSuccess: (result) => toast.success(result.message),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )

  const columns: Column<UserSummary>[] = [
    {
      key: 'name',
      header: 'Usuario',
      cell: (row) => (
        <div>
          <p className="font-semibold text-ink">
            {row.full_name}
            {row.id === me?.id && (
              <span className="ml-2 text-[13px] font-normal text-ink-muted">(usted)</span>
            )}
          </p>
          <p className="text-[13px] text-ink-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      hideOnMobile: true,
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((role) => (
            <Badge key={role}>{role}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'last_login',
      header: 'Último acceso',
      hideOnMobile: true,
      cell: (row) =>
        row.last_login_at ? (
          formatDateTime(row.last_login_at)
        ) : (
          <span className="text-ink-subtle">Nunca</span>
        ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (row) => (
        <Badge tone={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      className: 'w-16',
      cell: (row) => {
        const isMe = row.id === me?.id

        return (
          <RowActions
            label={`Acciones para ${row.full_name}`}
            actions={[
              { label: 'Editar', icon: Pencil, onSelect: () => setEditing(row.id), hidden: !canManage },
              {
                label: 'Restablecer contraseña',
                icon: KeyRound,
                onSelect: () => setResetting(row),
                hidden: !canManage || isMe,
              },
              {
                label: row.is_active ? 'Desactivar' : 'Activar',
                icon: Power,
                tone: row.is_active ? 'danger' : 'default',
                onSelect: () => (row.is_active ? setDeactivating(row) : activate(row)),
                hidden: !canManage || isMe,
              },
            ]}
          />
        )
      },
    },
  ]

  return (
    <>
      {!canManage && (
        <Alert tone="info" className="mb-4">
          Solo puede consultar. Crear o modificar usuarios requiere el permiso de administrar usuarios.
        </Alert>
      )}
      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              label="Buscar usuarios"
              placeholder="Buscar por nombre o correo"
              value={list.search}
              onChange={list.setSearch}
              className="sm:w-80"
            />
            <StatusFilter value={list.status} onChange={list.setStatus} />
          </div>
          {canManage && (
            <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setEditing('new')}>
              Nuevo usuario
            </Button>
          )}
        </div>
        {list.query.isError ? (
          <Alert tone="danger" className="m-4">
            {errorMessage(list.query.error)}
          </Alert>
        ) : (
          <DataTable
            caption="Usuarios"
            columns={columns}
            rows={data?.items ?? []}
            getRowKey={(row) => row.id}
            loading={list.query.isFetching}
            empty={{
              icon: UserCog,
              title: list.isFiltered ? 'No hay usuarios con esos filtros' : 'Todavía no hay usuarios',
              description: list.isFiltered
                ? 'Pruebe con otra búsqueda o cambie el estado.'
                : 'Cree el primer usuario.',
            }}
          />
        )}
        {data && (
          <Pagination
            page={data.page}
            pageSize={data.page_size}
            totalItems={data.total_items}
            totalPages={data.total_pages}
            onPageChange={list.pagination.setPage}
            onPageSizeChange={list.pagination.setPageSize}
          />
        )}
      </section>
      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? 'Nuevo usuario' : 'Editar usuario'}
        description="Los campos con * son obligatorios."
        size="lg"
      >
        {editing === 'new' && (
          <UserForm
            onCancel={() => setEditing(null)}
            onSaved={(message) => {
              toast.success(message)
              setEditing(null)
            }}
          />
        )}
        {typeof editing === 'number' && <EditUserModalBody id={editing} onClose={() => setEditing(null)} />}
      </Modal>
      <Modal
        open={resetting !== null}
        onOpenChange={(open) => !open && setResetting(null)}
        title="Restablecer contraseña"
        description={resetting?.email}
        size="md"
      >
        {resetting && (
          <ResetPasswordForm
            user={resetting}
            onCancel={() => setResetting(null)}
            onSaved={(message) => {
              toast.success(message)
              setResetting(null)
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title="Desactivar usuario"
        description={`${deactivating?.full_name ?? ''} no podrá iniciar sesión y se cerrarán todas sus sesiones abiertas.`}
        confirmLabel="Desactivar"
        variant="danger"
        loading={setActive.isPending}
        onConfirm={() => {
          if (!deactivating) {
            return
          }

          setActive.mutate(
            { id: deactivating.id, active: false },
            {
              onSuccess: (result) => toast.success(result.message),
              onError: (error) => toast.error(errorMessage(error)),
              onSettled: () => setDeactivating(null),
            },
          )
        }}
      />
    </>
  )
}

export function UsersPage() {
  const { can } = useSession()

  const tabs: TabItem[] = [
    ...(can(PERMISSIONS.users.view) ? [{ value: 'users', label: 'Usuarios', content: <UsersPanel /> }] : []),
    ...(can(PERMISSIONS.roles.view) ? [{ value: 'roles', label: 'Roles', content: <RolesPanel /> }] : []),
  ]

  return (
    <>
      <PageHeader title="Usuarios y roles" description="Quién accede a RIMETRIK y qué puede hacer." />
      <Tabs label="Secciones de usuarios" items={tabs} />
    </>
  )
}
