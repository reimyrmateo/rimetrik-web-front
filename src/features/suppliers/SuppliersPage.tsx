import { Pencil, Plus, Power, Trash2, Truck } from 'lucide-react'
import { useSession } from '@/core/auth/useSession'
import { PERMISSIONS } from '@/core/constants/permissions'
import { errorMessage } from '@/core/errors/ApiError'
import { SupplierForm } from '@/features/suppliers/SupplierForm'
import type { Supplier } from '@/features/suppliers/supplierTypes'
import { useSupplierMutations, useSuppliers } from '@/features/suppliers/useSuppliers'
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

export function SuppliersPage() {
  const { can } = useSession()
  const canManage = can(PERMISSIONS.catalogs.manage)
  const list = useSuppliers()
  const mutations = useSupplierMutations()
  const actions = useCatalogActions(mutations, toast, errorMessage)
  const data = list.query.data

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Proveedor',
      cell: (supplier) => (
        <div>
          <p className="font-semibold text-ink">{supplier.name}</p>
          {supplier.document_number && (
            <p className="text-[13px] text-ink-muted">
              {supplier.document_type === 'RNC' ? 'RNC' : 'Doc.'}{' '}
              {formatDocument(supplier.document_type, supplier.document_number)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      cell: (supplier) => supplier.category ?? '—',
      hideOnMobile: true,
    },
    { key: 'email', header: 'Correo', cell: (supplier) => supplier.email ?? '—', hideOnMobile: true },
    { key: 'phone', header: 'Teléfono', cell: (supplier) => supplier.phone ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: 'Estado',
      cell: (supplier) => (
        <Badge tone={supplier.is_active ? 'success' : 'neutral'}>
          {supplier.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      className: 'w-16',
      cell: (supplier) => (
        <RowActions
          label={`Acciones para ${supplier.name}`}
          actions={[
            { label: 'Editar', icon: Pencil, onSelect: () => actions.openEdit(supplier), hidden: !canManage },
            {
              label: supplier.is_active ? 'Desactivar' : 'Activar',
              icon: Power,
              onSelect: () => actions.toggle(supplier),
              hidden: !canManage,
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              tone: 'danger',
              onSelect: () => actions.askDelete(supplier),
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
        title="Proveedores"
        description="Empresas y personas que suministran materiales y servicios a sus obras."
        actions={
          canManage && (
            <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={actions.openCreate}>
              Nuevo proveedor
            </Button>
          )
        }
      />
      {!canManage && (
        <Alert tone="info" className="mb-4">
          Solo puede consultar el listado; crear o modificar proveedores requiere administrar catálogos.
        </Alert>
      )}
      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            label="Buscar proveedores"
            placeholder="Buscar por nombre, categoría o documento"
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
            caption="Listado de proveedores"
            columns={columns}
            rows={data?.items ?? []}
            getRowKey={(supplier) => supplier.id}
            loading={list.query.isFetching}
            empty={{
              icon: Truck,
              title: list.isFiltered ? 'No hay proveedores con esos filtros' : 'Todavía no hay proveedores',
              description: list.isFiltered
                ? 'Pruebe con otra búsqueda o cambie el estado.'
                : 'Registre el primer proveedor para asociarlo a sus gastos.',
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
        title={editing === 'new' ? 'Nuevo proveedor' : 'Editar proveedor'}
        description="Los campos con * son obligatorios."
        size="md"
      >
        {editing !== null && (
          <SupplierForm
            {...(editing === 'new' ? {} : { supplier: editing })}
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
        title={actions.confirm?.kind === 'delete' ? 'Eliminar proveedor' : 'Desactivar proveedor'}
        description={
          actions.confirm?.kind === 'delete'
            ? `Se eliminará «${actions.confirm.item.name}». Solo es posible si no tiene gastos ni cuentas por pagar registrados.`
            : `«${actions.confirm?.item.name ?? ''}» dejará de ofrecerse para gastos nuevos. Lo registrado no cambia.`
        }
        confirmLabel={actions.confirm?.kind === 'delete' ? 'Eliminar' : 'Desactivar'}
        variant={actions.confirm?.kind === 'delete' ? 'danger' : 'primary'}
        loading={actions.confirming}
        onConfirm={actions.runConfirm}
      />
    </>
  )
}
