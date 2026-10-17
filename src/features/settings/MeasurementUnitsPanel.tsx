import { Pencil, Plus, Power, Ruler, Trash2 } from 'lucide-react'
import { useSession } from '@/core/auth/useSession'
import { PERMISSIONS } from '@/core/constants/permissions'
import { errorMessage } from '@/core/errors/ApiError'
import type { MeasurementUnit } from '@/features/settings/settingsTypes'
import { UnitForm } from '@/features/settings/SimpleCatalogForm'
import { useUnitMutations, useUnits } from '@/features/settings/useSettings'
import { Alert } from '@/shared/components/Alert'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable, type Column } from '@/shared/components/DataTable'
import { Modal } from '@/shared/components/Modal'
import { Pagination } from '@/shared/components/Pagination'
import { RowActions } from '@/shared/components/RowActions'
import { SearchInput } from '@/shared/components/SearchInput'
import { StatusFilter } from '@/shared/components/StatusFilter'
import { toast } from '@/shared/components/Toaster'
import { useCatalogActions } from '@/shared/hooks/useCatalogList'

export function MeasurementUnitsPanel() {
  const { can } = useSession()
  const canManage = can(PERMISSIONS.catalogs.manage)
  const list = useUnits()
  const mutations = useUnitMutations()
  const actions = useCatalogActions(mutations, toast, errorMessage)
  const data = list.query.data

  const columns: Column<MeasurementUnit>[] = [
    {
      key: 'name',
      header: 'Unidad',
      cell: (unit) => <span className="font-semibold text-ink">{unit.name}</span>,
    },
    { key: 'symbol', header: 'Símbolo', cell: (unit) => unit.symbol },
    {
      key: 'status',
      header: 'Estado',
      cell: (unit) => (
        <Badge tone={unit.is_active ? 'success' : 'neutral'}>{unit.is_active ? 'Activa' : 'Inactiva'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      className: 'w-16',
      cell: (unit) => (
        <RowActions
          label={`Acciones para ${unit.name}`}
          actions={[
            { label: 'Editar', icon: Pencil, onSelect: () => actions.openEdit(unit), hidden: !canManage },
            {
              label: unit.is_active ? 'Desactivar' : 'Activar',
              icon: Power,
              onSelect: () => actions.toggle(unit),
              hidden: !canManage,
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              tone: 'danger',
              onSelect: () => actions.askDelete(unit),
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
              label="Buscar unidades"
              placeholder="Buscar por nombre o símbolo"
              value={list.search}
              onChange={list.setSearch}
              className="sm:w-80"
            />
            <StatusFilter value={list.status} onChange={list.setStatus} />
          </div>
          {canManage && (
            <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={actions.openCreate}>
              Nueva unidad
            </Button>
          )}
        </div>
        {list.query.isError ? (
          <Alert tone="danger" className="m-4">
            {errorMessage(list.query.error)}
          </Alert>
        ) : (
          <DataTable
            caption="Unidades de medida"
            columns={columns}
            rows={data?.items ?? []}
            getRowKey={(unit) => unit.id}
            loading={list.query.isFetching}
            empty={{
              icon: Ruler,
              title: list.isFiltered ? 'No hay unidades con esos filtros' : 'Todavía no hay unidades',
              description: list.isFiltered
                ? 'Pruebe con otra búsqueda o cambie el estado.'
                : 'Las unidades se usan en las partidas de los presupuestos.',
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
        title={editing === 'new' ? 'Nueva unidad' : 'Editar unidad'}
        description="Los campos con * son obligatorios."
        size="sm"
      >
        {editing !== null && (
          <UnitForm
            {...(editing === 'new' ? {} : { unit: editing })}
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
        title={actions.confirm?.kind === 'delete' ? 'Eliminar unidad' : 'Desactivar unidad'}
        description={
          actions.confirm?.kind === 'delete'
            ? `Se eliminará «${actions.confirm.item.name}». Solo es posible si ninguna partida la usa.`
            : `«${actions.confirm?.item.name ?? ''}» dejará de ofrecerse en partidas nuevas. Las existentes no cambian.`
        }
        confirmLabel={actions.confirm?.kind === 'delete' ? 'Eliminar' : 'Desactivar'}
        variant={actions.confirm?.kind === 'delete' ? 'danger' : 'primary'}
        loading={actions.confirming}
        onConfirm={actions.runConfirm}
      />
    </>
  )
}
