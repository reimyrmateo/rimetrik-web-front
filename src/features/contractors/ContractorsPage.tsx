import { HardHat, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/core/auth/useSession'
import { PERMISSIONS } from '@/core/constants/permissions'
import { errorMessage } from '@/core/errors/ApiError'
import { ContractorForm } from '@/features/contractors/ContractorForm'
import {
  WORKER_TYPE_LABELS,
  WORKER_TYPE_OPTIONS,
  type Contractor,
  type WorkerType,
} from '@/features/contractors/contractorTypes'
import { useContractorMutations, useContractors } from '@/features/contractors/useContractors'
import { Alert } from '@/shared/components/Alert'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable, type Column } from '@/shared/components/DataTable'
import { Modal } from '@/shared/components/Modal'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/components/Pagination'
import { RowActions } from '@/shared/components/RowActions'
import { Select } from '@/shared/components/Select'
import { SearchInput } from '@/shared/components/SearchInput'
import { StatusFilter } from '@/shared/components/StatusFilter'
import { toast } from '@/shared/components/Toaster'
import { useCatalogActions } from '@/shared/hooks/useCatalogList'
import { formatDocument } from '@/shared/utils/format'

export function ContractorsPage() {
  const { can } = useSession()
  const [workerType, setWorkerType] = useState<WorkerType | ''>('')
  const canManage = can(PERMISSIONS.catalogs.manage)
  const list = useContractors(workerType)
  const mutations = useContractorMutations()
  const actions = useCatalogActions(mutations, toast, errorMessage)
  const data = list.query.data

  const columns: Column<Contractor>[] = [
    {
      key: 'name',
      header: 'Colaborador',
      cell: (contractor) => (
        <div>
          <p className="font-semibold text-ink">{contractor.full_name}</p>
          {contractor.document_number && (
            <p className="text-[13px] text-ink-muted">
              {contractor.document_type === 'RNC' ? 'RNC' : 'Doc.'}{' '}
              {formatDocument(contractor.document_type, contractor.document_number)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      cell: (contractor) => (
        <Badge tone={contractor.worker_type === 'CONTRACTOR' ? 'info' : 'brand'}>
          {WORKER_TYPE_LABELS[contractor.worker_type]}
        </Badge>
      ),
    },
    {
      key: 'specialty',
      header: 'Especialidad',
      cell: (contractor) => contractor.specialty ?? '—',
      hideOnMobile: true,
    },
    { key: 'phone', header: 'Teléfono', cell: (contractor) => contractor.phone ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: 'Estado',
      cell: (contractor) => (
        <Badge tone={contractor.is_active ? 'success' : 'neutral'}>
          {contractor.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      className: 'w-16',
      cell: (contractor) => (
        <RowActions
          label={`Acciones para ${contractor.full_name}`}
          actions={[
            {
              label: 'Editar',
              icon: Pencil,
              onSelect: () => actions.openEdit(contractor),
              hidden: !canManage,
            },
            {
              label: contractor.is_active ? 'Desactivar' : 'Activar',
              icon: Power,
              onSelect: () => actions.toggle(contractor),
              hidden: !canManage,
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              tone: 'danger',
              onSelect: () => actions.askDelete(contractor),
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
        title="Contratistas y personal"
        description="Empleados y contratistas que trabajan en sus obras."
        actions={
          canManage && (
            <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={actions.openCreate}>
              Nuevo colaborador
            </Button>
          )
        }
      />
      {!canManage && (
        <Alert tone="info" className="mb-4">
          Solo puede consultar. El documento y el teléfono solo se muestran a quienes administran catálogos.
        </Alert>
      )}
      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              label="Buscar colaboradores"
              placeholder={
                canManage ? 'Buscar por nombre, especialidad o documento' : 'Buscar por nombre o especialidad'
              }
              value={list.search}
              onChange={list.setSearch}
              className="sm:w-80"
            />
            <Select
              aria-label="Tipo de colaborador"
              options={WORKER_TYPE_OPTIONS}
              placeholder="Todos los tipos"
              value={workerType}
              onChange={(event) => {
                setWorkerType(event.target.value as WorkerType | '')
                list.pagination.reset()
              }}
              className="sm:w-48"
            />
          </div>
          <StatusFilter value={list.status} onChange={list.setStatus} />
        </div>
        {list.query.isError ? (
          <Alert tone="danger" className="m-4">
            {errorMessage(list.query.error)}
          </Alert>
        ) : (
          <DataTable
            caption="Listado de contratistas y personal"
            columns={columns}
            rows={data?.items ?? []}
            getRowKey={(contractor) => contractor.id}
            loading={list.query.isFetching}
            empty={{
              icon: HardHat,
              title: list.isFiltered
                ? 'No hay colaboradores con esos filtros'
                : 'Todavía no hay colaboradores',
              description: list.isFiltered
                ? 'Pruebe con otra búsqueda o cambie el estado.'
                : 'Registre empleados y contratistas para asignarlos a sus obras.',
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
        title={editing === 'new' ? 'Nuevo colaborador' : 'Editar colaborador'}
        description="Los campos con * son obligatorios."
        size="md"
      >
        {editing !== null && (
          <ContractorForm
            {...(editing === 'new' ? {} : { contractor: editing })}
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
        title={actions.confirm?.kind === 'delete' ? 'Eliminar colaborador' : 'Desactivar colaborador'}
        description={
          actions.confirm?.kind === 'delete'
            ? `Se eliminará «${actions.confirm.item.full_name}». Solo es posible si nunca se asignó a obras ni tiene gastos, nómina u obligaciones.`
            : `«${actions.confirm?.item.full_name ?? ''}» dejará de ofrecerse para asignaciones, gastos y nómina nuevos. Lo registrado no cambia.`
        }
        confirmLabel={actions.confirm?.kind === 'delete' ? 'Eliminar' : 'Desactivar'}
        variant={actions.confirm?.kind === 'delete' ? 'danger' : 'primary'}
        loading={actions.confirming}
        onConfirm={actions.runConfirm}
      />
    </>
  )
}
