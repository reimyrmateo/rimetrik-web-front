import { useSession } from '@/core/auth/useSession'
import { BANK_ACCOUNT_READ_PERMISSIONS, PERMISSIONS } from '@/core/constants/permissions'
import { BankAccountsPanel } from '@/features/settings/BankAccountsPanel'
import { ExpenseCategoriesPanel } from '@/features/settings/ExpenseCategoriesPanel'
import { MeasurementUnitsPanel } from '@/features/settings/MeasurementUnitsPanel'
import { PageHeader } from '@/shared/components/PageHeader'
import { Tabs, type TabItem } from '@/shared/components/Tabs'

export function SettingsPage() {
  const { can } = useSession()

  const tabs: TabItem[] = [
    ...(can(BANK_ACCOUNT_READ_PERMISSIONS)
      ? [{ value: 'accounts', label: 'Cuentas y cajas', content: <BankAccountsPanel /> }]
      : []),
    ...(can(PERMISSIONS.catalogs.view)
      ? [
          { value: 'categories', label: 'Categorías de gasto', content: <ExpenseCategoriesPanel /> },
          { value: 'units', label: 'Unidades de medida', content: <MeasurementUnitsPanel /> },
        ]
      : []),
  ]

  return (
    <>
      <PageHeader title="Configuración" description="Catálogos que comparten todas las obras." />
      <Tabs label="Secciones de configuración" items={tabs} />
    </>
  )
}
