import { Landmark, Pencil, Plus, Power, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/core/auth/useSession'
import { PERMISSIONS } from '@/core/constants/permissions'
import { errorMessage } from '@/core/errors/ApiError'
import { BankAccountForm } from '@/features/settings/BankAccountForm'
import { OpeningBalanceForm } from '@/features/settings/OpeningBalanceForm'
import { ACCOUNT_TYPE_LABELS, type BankAccount } from '@/features/settings/settingsTypes'
import { useBankAccountMutations, useBankAccounts } from '@/features/settings/useSettings'
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
import { formatDate, formatMoney } from '@/shared/utils/format'

export function BankAccountsPanel() {
  const { can } = useSession()
  const canManage = can(PERMISSIONS.catalogs.manageBankAccounts)
  const list = useBankAccounts()
  const mutations = useBankAccountMutations()
  const actions = useCatalogActions(mutations, toast, errorMessage)
  const [openingFor, setOpeningFor] = useState<BankAccount | null>(null)
  const data = list.query.data

  const columns: Column<BankAccount>[] = [
    {
      key: 'name',
      header: 'Cuenta',
      cell: (account) => (
        <div>
          <p className="font-semibold text-ink">{account.name}</p>
          <p className="text-[13px] text-ink-muted">
            {[account.bank_name, account.account_last4 && `•••• ${account.account_last4}`]
              .filter(Boolean)
              .join(' · ') || 'Sin banco'}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      cell: (account) => ACCOUNT_TYPE_LABELS[account.account_type],
      hideOnMobile: true,
    },
    {
      key: 'opening',
      header: 'Saldo inicial',
      align: 'right',
      hideOnMobile: true,
      cell: (account) =>
        account.opening_date ? (
          <div className="tabular">
            <p className="font-semibold text-ink">{formatMoney(account.opening_balance)}</p>
            <p className="text-[13px] text-ink-muted">al {formatDate(account.opening_date)}</p>
          </div>
        ) : (
          <span className="text-ink-subtle">Sin definir</span>
        ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (account) => (
        <Badge tone={account.is_active ? 'success' : 'neutral'}>
          {account.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      className: 'w-16',
      cell: (account) => (
        <RowActions
          label={`Acciones para ${account.name}`}
          actions={[
            { label: 'Editar', icon: Pencil, onSelect: () => actions.openEdit(account), hidden: !canManage },
            {
              label: 'Saldo inicial',
              icon: Wallet,
              onSelect: () => setOpeningFor(account),
              hidden: !canManage,
            },
            {
              label: account.is_active ? 'Desactivar' : 'Activar',
              icon: Power,
              onSelect: () => actions.toggle(account),
              hidden: !canManage,
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              tone: 'danger',
              onSelect: () => actions.askDelete(account),
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
      {!canManage && (
        <Alert tone="info" className="mb-4">
          Solo puede consultar. Crear o modificar cuentas requiere el permiso de administrar cuentas.
        </Alert>
      )}
      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              label="Buscar cuentas"
              placeholder="Buscar por nombre, banco o últimos dígitos"
              value={list.search}
              onChange={list.setSearch}
              className="sm:w-80"
            />
            <StatusFilter value={list.status} onChange={list.setStatus} />
          </div>
          {canManage && (
            <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={actions.openCreate}>
              Nueva cuenta
            </Button>
          )}
        </div>
        {list.query.isError ? (
          <Alert tone="danger" className="m-4">
            {errorMessage(list.query.error)}
          </Alert>
        ) : (
          <DataTable
            caption="Cuentas bancarias y cajas"
            columns={columns}
            rows={data?.items ?? []}
            getRowKey={(account) => account.id}
            loading={list.query.isFetching}
            empty={{
              icon: Landmark,
              title: list.isFiltered ? 'No hay cuentas con esos filtros' : 'Todavía no hay cuentas',
              description: list.isFiltered
                ? 'Pruebe con otra búsqueda o cambie el estado.'
                : 'Registre las cuentas y cajas desde las que se cobra y se paga.',
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
        title={editing === 'new' ? 'Nueva cuenta' : 'Editar cuenta'}
        description="Los campos con * son obligatorios."
        size="md"
      >
        {editing !== null && (
          <BankAccountForm
            {...(editing === 'new' ? {} : { account: editing })}
            onCancel={actions.closeEditor}
            onSaved={(message) => {
              toast.success(message)
              actions.closeEditor()
            }}
          />
        )}
      </Modal>
      <Modal
        open={openingFor !== null}
        onOpenChange={(open) => !open && setOpeningFor(null)}
        title="Saldo inicial"
        description={openingFor?.name}
        size="md"
      >
        {openingFor && (
          <OpeningBalanceForm
            account={openingFor}
            onCancel={() => setOpeningFor(null)}
            onSaved={(message) => {
              toast.success(message)
              setOpeningFor(null)
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={actions.confirm !== null}
        onOpenChange={(open) => !open && actions.closeConfirm()}
        title={actions.confirm?.kind === 'delete' ? 'Eliminar cuenta' : 'Desactivar cuenta'}
        description={
          actions.confirm?.kind === 'delete'
            ? `Se eliminará «${actions.confirm.item.name}». Solo es posible si no tiene cobros, pagos, gastos de contado ni transferencias.`
            : `«${actions.confirm?.item.name ?? ''}» dejará de admitir movimientos nuevos. Los registrados no cambian.`
        }
        confirmLabel={actions.confirm?.kind === 'delete' ? 'Eliminar' : 'Desactivar'}
        variant={actions.confirm?.kind === 'delete' ? 'danger' : 'primary'}
        loading={actions.confirming}
        onConfirm={actions.runConfirm}
      />
    </>
  )
}
