import { Pencil, Plus, Power, Tags, Trash2 } from 'lucide-react'
import { useSession } from '@/core/auth/useSession'
import { PERMISSIONS } from '@/core/constants/permissions'
import { errorMessage } from '@/core/errors/ApiError'
import type { ExpenseCategory } from '@/features/settings/settingsTypes'
import { CategoryForm } from '@/features/settings/SimpleCatalogForm'
import { useCategories, useCategoryMutations } from '@/features/settings/useSettings'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Alert } from '@/shared/components/Alert'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable, type Column } from '@/shared/components/DataTable'
import { Modal } from '@/shared/components/Modal'
import { Pagination } from '@/shared/components/Pagination'
import { RowActions } from '@/shared/components/RowActions'
import { SearchInput } from '@/shared/components/SearchInput'
import { StatusFilter } from '@/shared/components/StatusFilter'
import { toast } from '@/shared/components/Toaster'
import { useCatalogActions } from '@/shared/hooks/useCatalogList'

const SORT_STEP = 10

export function ExpenseCategoriesPanel() {
  const { can } = useSession()
  const canManage = can(PERMISSIONS.catalogs.manage)
  const list = useCategories()
  const mutations = useCategoryMutations()
  const actions = useCatalogActions(mutations, toast, errorMessage)
  const data = list.query.data
  const onLastPage = data !== undefined && data.page >= data.total_pages
  const nextSortOrder =
    onLastPage && !list.isFiltered && data.items.length > 0
      ? Math.max(...data.items.map((category) => category.sort_order)) + SORT_STEP
      : 0

  const columns: Column<ExpenseCategory>[] = [
    { key: 'order', header: 'Orden', className: 'w-20 tabular', cell: (category) => category.sort_order },
    {
      key: 'name',
      header: 'Categoría',
      cell: (category) => <span className="font-semibold text-ink">{category.name}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (category) => (
        <Badge tone={category.is_active ? 'success' : 'neutral'}>
          {category.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      className: 'w-16',
      cell: (category) => (
        <RowActions
          label={`Acciones para ${category.name}`}
          actions={[
            { label: 'Editar', icon: Pencil, onSelect: () => actions.openEdit(category), hidden: !canManage },
            {
              label: category.is_active ? 'Desactivar' : 'Activar',
              icon: Power,
              onSelect: () => actions.toggle(category),
              hidden: !canManage,
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              tone: 'danger',
              onSelect: () => actions.askDelete(category),
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
      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              label="Buscar categorías"
              placeholder="Buscar por nombre"
              value={list.search}
              onChange={list.setSearch}
              className="sm:w-80"
            />
            <StatusFilter value={list.status} onChange={list.setStatus} />
          </div>
          {canManage && (
            <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={actions.openCreate}>
              Nueva categoría
            </Button>
          )}
        </div>
        {list.query.isError ? (
          <Alert tone="danger" className="m-4">
            {errorMessage(list.query.error)}
          </Alert>
        ) : (
          <DataTable
            caption="Categorías de gasto"
            columns={columns}
            rows={data?.items ?? []}
            getRowKey={(category) => category.id}
            loading={list.query.isFetching}
            empty={{
              icon: Tags,
              title: list.isFiltered ? 'No hay categorías con esos filtros' : 'Todavía no hay categorías',
              description: list.isFiltered
                ? 'Pruebe con otra búsqueda o cambie el estado.'
                : 'Las categorías clasifican los gastos y las proyecciones de costo.',
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
        title={editing === 'new' ? 'Nueva categoría' : 'Editar categoría'}
        description="Los campos con * son obligatorios."
        size="sm"
      >
        {editing !== null && (
          <CategoryForm
            {...(editing === 'new' ? { nextSortOrder } : { category: editing })}
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
        title={actions.confirm?.kind === 'delete' ? 'Eliminar categoría' : 'Desactivar categoría'}
        description={
          actions.confirm?.kind === 'delete'
            ? `Se eliminará «${actions.confirm.item.name}». Solo es posible si ningún gasto ni proyección la usa.`
            : `«${actions.confirm?.item.name ?? ''}» dejará de ofrecerse para gastos nuevos. Los existentes no cambian.`
        }
        confirmLabel={actions.confirm?.kind === 'delete' ? 'Eliminar' : 'Desactivar'}
        variant={actions.confirm?.kind === 'delete' ? 'danger' : 'primary'}
        loading={actions.confirming}
        onConfirm={actions.runConfirm}
      />
    </>
  )
}
