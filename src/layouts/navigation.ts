import {
  BarChart3,
  Briefcase,
  FileText,
  FolderKanban,
  HardHat,
  LayoutGrid,
  Receipt,
  ScrollText,
  Settings,
  Truck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { BANK_ACCOUNT_READ_PERMISSIONS, PERMISSIONS } from '@/core/constants/permissions'
import { ROUTES } from '@/core/constants/routes'
import type { PermissionRequirement } from '@/core/security/can'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  requires: PermissionRequirement
  ready: boolean
}

export interface NavGroup {
  label: string
  items: readonly NavItem[]
}

export const NAVIGATION: readonly NavGroup[] = [
  {
    label: 'General',
    items: [
      {
        label: 'Resumen',
        to: ROUTES.dashboard,
        icon: LayoutGrid,
        requires: PERMISSIONS.dashboard.view,
        ready: false,
      },
      {
        label: 'Proyectos',
        to: ROUTES.projects,
        icon: FolderKanban,
        requires: PERMISSIONS.projects.view,
        ready: false,
      },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      {
        label: 'Presupuestos',
        to: ROUTES.budgets,
        icon: FileText,
        requires: PERMISSIONS.budgets.view,
        ready: false,
      },
      {
        label: 'Ingresos',
        to: ROUTES.income,
        icon: Receipt,
        requires: PERMISSIONS.collections.view,
        ready: false,
      },
      {
        label: 'Gastos',
        to: ROUTES.expenses,
        icon: Briefcase,
        requires: PERMISSIONS.costs.view,
        ready: false,
      },
      {
        label: 'Cuentas por pagar',
        to: ROUTES.payables,
        icon: Wallet,
        requires: [PERMISSIONS.costs.view, PERMISSIONS.costs.managePayments],
        ready: false,
      },
    ],
  },
  {
    label: 'Gestión',
    items: [
      {
        label: 'Contratistas y personal',
        to: ROUTES.contractors,
        icon: HardHat,
        requires: PERMISSIONS.catalogs.view,
        ready: true,
      },
      {
        label: 'Clientes',
        to: ROUTES.clients,
        icon: Users,
        requires: PERMISSIONS.catalogs.view,
        ready: true,
      },
      {
        label: 'Proveedores',
        to: ROUTES.suppliers,
        icon: Truck,
        requires: PERMISSIONS.catalogs.view,
        ready: true,
      },
      {
        label: 'Adicionales de obra',
        to: ROUTES.changeOrders,
        icon: ScrollText,
        requires: PERMISSIONS.budgets.view,
        ready: false,
      },
    ],
  },
  {
    label: 'Análisis',
    items: [
      {
        label: 'Reportes',
        to: ROUTES.reports,
        icon: BarChart3,
        requires: PERMISSIONS.dashboard.view,
        ready: false,
      },
      {
        label: 'Documentos',
        to: ROUTES.documents,
        icon: FileText,
        requires: PERMISSIONS.documents.view,
        ready: false,
      },
    ],
  },
  {
    label: 'Sistema',
    items: [
      {
        label: 'Usuarios y roles',
        to: ROUTES.users,
        icon: UserCog,
        requires: [PERMISSIONS.users.view, PERMISSIONS.roles.view],
        ready: true,
      },
      {
        label: 'Configuración',
        to: ROUTES.settings,
        icon: Settings,
        requires: [PERMISSIONS.catalogs.view, ...BANK_ACCOUNT_READ_PERMISSIONS],
        ready: true,
      },
    ],
  },
]
