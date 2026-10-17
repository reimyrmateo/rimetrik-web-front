import type { ReactNode } from 'react'
import { EmptyState, type EmptyStateProps } from '@/shared/components/EmptyState'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
  hideOnMobile?: boolean
}

export interface DataTableProps<T> {
  columns: readonly Column<T>[]
  rows: readonly T[]
  getRowKey: (row: T) => string | number
  caption: string
  loading?: boolean
  empty?: EmptyStateProps
  onRowClick?: (row: T) => void
  footer?: ReactNode
}

const alignment = { left: 'text-left', right: 'text-right', center: 'text-center' }

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  loading = false,
  empty = { title: 'Sin registros', description: 'No hay información para mostrar.' },
  onRowClick,
  footer,
}: DataTableProps<T>) {
  if (!loading && rows.length === 0) {
    return <EmptyState {...empty} />
  }

  return (
    <div className="relative overflow-x-auto" aria-busy={loading || undefined}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase',
                  alignment[column.align ?? 'left'],
                  column.hideOnMobile && 'hidden md:table-cell',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-line last:border-b-0',
                onRowClick && 'cursor-pointer transition-colors hover:bg-canvas',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 align-middle text-ink',
                    alignment[column.align ?? 'left'],
                    column.align === 'right' && 'tabular',
                    column.hideOnMobile && 'hidden md:table-cell',
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
          <Spinner className="text-brand-600" />
        </div>
      )}
      {footer}
    </div>
  )
}
