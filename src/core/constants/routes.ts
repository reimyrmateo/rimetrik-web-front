export const ROUTES = {
  login: '/login',
  home: '/',
  account: '/cuenta',
  dashboard: '/resumen',
  projects: '/proyectos',
  budgets: '/presupuestos',
  income: '/ingresos',
  expenses: '/gastos',
  payables: '/cuentas-por-pagar',
  contractors: '/contratistas',
  clients: '/clientes',
  suppliers: '/proveedores',
  changeOrders: '/adicionales',
  reports: '/reportes',
  documents: '/documentos',
  users: '/usuarios',
  settings: '/configuracion',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
