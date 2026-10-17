import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumb?: ReactNode
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {breadcrumb && (
        <nav aria-label="Ruta de navegación" className="mb-2 text-[13px] text-ink-muted">
          {breadcrumb}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}
