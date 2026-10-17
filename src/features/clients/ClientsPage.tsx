import { Pencil, Plus, Power, Trash2, Users } from 'lucide-react'
import { useSession } from '@/core/auth/useSession'
import { PERMISSIONS } from '@/core/constants/permissions'
import { errorMessage } from '@/core/errors/ApiError'
import { ClientForm } from '@/features/clients/ClientForm'
import type { Client } from '@/features/clients/clientTypes'
import { useClientMutations, useClients } from '@/features/clients/useClients'
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
import { StatusFilter } from '@/shared/components/StatusFilter'
import { toast } from '@/shared/components/Toaster'
import { useCatalogActions } from '@/shared/hooks/useCatalogList'
import { formatDocument } from '@/shared/utils/format'

export function ClientsPage() {
  const { can } = useSession()
  const canManage = can(PERMISSIONS.catalogs.manage)
  const list = useClients()
  const mutations = useClientMutations()
  const actions = useCatalogActions(mutations, toast, errorMessage)
  const data = list.query.data

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Cliente',
      cell: (client) => (
        <div>
          <p className="font-semibold text-ink">{client.name}</p>
          {client.document_number && (
            <p className="text-[13px] text-ink-muted">
              {client.document_type === 'RNC' ? 'RNC' : 'Doc.'}{' '}
              {formatDocument(client.document_type, client.document_number)}
            </p>
          )}
        </div>
      ),
    },
    { key: 'email', header: 'Correo', cell: (client) => client.email ?? '—', hideOnMobile: true },
    { key: 'phone', header: 'Teléfono', cell: (client) => client.phone ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: 'Estado',
      cell: (client) => (
        <Badge tone={client.is_active ? 'success' : 'neutral'}>
          {client.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      className: 'w-16',
      cell: (client) => (
        <RowActions
          label={`Acciones para ${client.name}`}
          actions={[
            { label: 'Editar', icon: Pencil, onSelect: () => actions.openEdit(client), hidden: !canManage },
            {
              label: client.is_active ? 'Desactivar' : 'Activar',
              icon: Power,
              onSelect: () => actions.toggle(client),
              hidden: !canManage,
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              tone: 'danger',
              onSelect: () => actions.askDelete(client),
              hidden: !canManage,
            },
          ]}
        />
      ),
    },
  ]

  const editing = actions.editing

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Personas y empresas para las que se ejecutan obras."
        actions={
          canManage && (
            <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={actions.openCreate}>
              Nuevo cliente
            </Button>
          )
        }
      />
      {!canManage && (
        <Alert tone="info" className="mb-4">
          Solo puede consultar. Los datos de contacto y documentos se muestran a quienes administran
          catálogos.
        </Alert>
      )}
      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            label="Buscar clientes"
            placeholder={canManage ? 'Buscar por nombre, correo o documento' : 'Buscar por nombre'}
            value={list.search}
            onChange={list.setSearch}
            className="sm:w-80"
          />
          <StatusFilter value={list.status} onChange={list.setStatus} />
        </div>
        {list.query.isError ? (
          <Alert tone="danger" className="m-4">
            {errorMessage(list.query.error)}
          </Alert>
        ) : (
          <DataTable
            caption="Listado de clientes"
            columns={columns}
            rows={data?.items ?? []}
            getRowKey={(client) => client.id}
            loading={list.query.isFetching}
            empty={{
              icon: Users,
              title: list.isFiltered ? 'No hay clientes con esos filtros' : 'Todavía no hay clientes',
              description: list.isFiltered
                ? 'Pruebe con otra búsqueda o cambie el estado.'
                : 'Registre el primer cliente para asociarlo a sus obras.',
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
        onOpenChange={(open) => !open && actions.closeEditor()}
        title={editing === 'new' ? 'Nuevo cliente' : 'Editar cliente'}
        description="Los campos con * son obligatorios."
        size="md"
      >
        {editing !== null && (
          <ClientForm
            {...(editing === 'new' ? {} : { client: editing })}
            onCancel={actions.closeEditor}
            onSaved={(message) => {
              toast.success(message)
              actions.closeEditor()
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={actions.confirm !== null}
        onOpenChange={(open) => !open && actions.closeConfirm()}
        title={actions.confirm?.kind === 'delete' ? 'Eliminar cliente' : 'Desactivar cliente'}
        description={
          actions.confirm?.kind === 'delete'
            ? `Se eliminará «${actions.confirm.item.name}». Solo es posible si no tiene obras registradas.`
            : `«${actions.confirm?.item.name ?? ''}» dejará de ofrecerse para obras nuevas. Sus obras existentes no cambian.`
        }
        confirmLabel={actions.confirm?.kind === 'delete' ? 'Eliminar' : 'Desactivar'}
        variant={actions.confirm?.kind === 'delete' ? 'danger' : 'primary'}
        loading={actions.confirming}
        onConfirm={actions.runConfirm}
      />
    </>
  )
}
