import { ChevronDown } from 'lucide-react'
import type { Ref, SelectHTMLAttributes } from 'react'
import { controlClass, useFieldContext } from '@/shared/components/FormField'
import type { SelectOption } from '@/shared/types/common'
import { cn } from '@/shared/utils/cn'

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: readonly SelectOption<string | number>[]
  placeholder?: string
  ref?: Ref<HTMLSelectElement>
}

export function Select({ options, placeholder, className, id, ref, ...props }: SelectProps) {
  const field = useFieldContext()

  return (
    <div className="relative">
      <select
        ref={ref}
        id={id ?? field?.id}
        aria-invalid={field?.invalid ? true : undefined}
        aria-describedby={field?.describedBy}
        aria-required={field?.required ? true : undefined}
        className={cn(controlClass, 'appearance-none pr-9', className)}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-subtle"
      />
    </div>
  )
}
