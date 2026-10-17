import { Search, X } from 'lucide-react'
import { Input } from '@/shared/components/Input'
import { MAX_SEARCH_LENGTH } from '@/shared/constants/ui'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  label,
  placeholder = 'Buscar…',
  className,
}: SearchInputProps) {
  return (
    <div className={className}>
      <Input
        type="search"
        aria-label={label}
        value={value}
        maxLength={MAX_SEARCH_LENGTH}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        leading={<Search className="size-4" aria-hidden="true" />}
        trailing={
          value ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => onChange('')}
              className="rounded-control p-1.5 text-ink-subtle hover:bg-canvas hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : undefined
        }
        className="[&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  )
}
