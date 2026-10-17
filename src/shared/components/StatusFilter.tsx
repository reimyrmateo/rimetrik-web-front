import type { StatusFilterValue } from '@/shared/types/common'
import { cn } from '@/shared/utils/cn'

const options: { value: StatusFilterValue; label: string }[] = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'all', label: 'Todos' },
]

export interface StatusFilterProps {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Estado"
      className="inline-flex rounded-control border border-line-strong bg-surface p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-8 rounded-[0.5rem] px-3 text-[13px] font-semibold text-ink-muted transition-colors hover:text-ink',
            value === option.value && 'bg-navy-900 text-white hover:text-white',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
