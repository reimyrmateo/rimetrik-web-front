import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { PAGE_SIZE_OPTIONS } from '@/shared/constants/ui'

export interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) {
    return null
  }

  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalItems)

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col gap-3 border-t border-line px-4 py-3 text-[13px] text-ink-muted sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite">
        {first}–{last} de {totalItems}
      </p>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span>Filas</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-8 rounded-control border border-line-strong bg-surface px-2 text-[13px] text-ink"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            icon={<ChevronLeft className="size-4" aria-hidden="true" />}
          />
          <span className="min-w-20 text-center">
            Página {page} de {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Página siguiente"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            icon={<ChevronRight className="size-4" aria-hidden="true" />}
          />
        </div>
      </div>
    </nav>
  )
}
