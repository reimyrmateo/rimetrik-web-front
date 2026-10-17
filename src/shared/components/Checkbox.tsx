import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { cn } from '@/shared/utils/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: string
  ref?: Ref<HTMLInputElement>
}

export function Checkbox({ label, description, className, id, ref, ...props }: CheckboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = description ? `${inputId}-description` : undefined

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        aria-describedby={descriptionId}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-line-strong accent-brand-600 disabled:cursor-not-allowed"
        {...props}
      />
      <div className="flex flex-col">
        <label htmlFor={inputId} className="cursor-pointer text-sm text-ink">
          {label}
        </label>
        {description && (
          <span id={descriptionId} className="text-[13px] text-ink-muted">
            {description}
          </span>
        )}
      </div>
    </div>
  )
}
