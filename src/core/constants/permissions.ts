export const PERMISSIONS = {
  users: { view: 'users.view', manage: 'users.manage' },
  roles: { view: 'roles.view', manage: 'roles.manage' },
  audit: { view: 'audit.view' },
  projects: {
    view: 'projects.view',
    viewAll: 'projects.view_all',
    manage: 'projects.manage',
    manageMembers: 'projects.members.manage',
    recordProgress: 'projects.progress.record',
  },
  catalogs: { view: 'catalogs.view', manage: 'catalogs.manage', manageBankAccounts: 'bank_accounts.manage' },
  budgets: { view: 'budgets.view', manage: 'budgets.manage', approve: 'budgets.approve' },
  changeOrders: { request: 'change_orders.request', approve: 'change_orders.approve' },
  collections: { view: 'collections.view', manage: 'collections.manage' },
  costs: {
    view: 'costs.view',
    manage: 'costs.manage',
    managePayments: 'payments.manage',
    managePayroll: 'payroll.manage',
  },
  documents: { view: 'documents.view', manage: 'documents.manage' },
  dashboard: { view: 'dashboard.view' },
} as const

type ValuesOf<T> = T extends string ? T : { [K in keyof T]: ValuesOf<T[K]> }[keyof T]

export type Permission = ValuesOf<typeof PERMISSIONS>

export const BANK_ACCOUNT_READ_PERMISSIONS = [
  PERMISSIONS.catalogs.manageBankAccounts,
  PERMISSIONS.collections.manage,
  PERMISSIONS.costs.manage,
  PERMISSIONS.costs.managePayments,
] as const satisfies readonly Permission[]
