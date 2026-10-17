import { createContext, use, useId, type ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

interface FieldContextValue {
  id: string
  describedBy: string | undefined
  invalid: boolean
  required: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

export function useFieldContext(): FieldContextValue | null {
  return use(FieldContext)
}

export interface FormFieldProps {
  label: string
  error?: string | undefined
  hint?: string
  required?: boolean
  optionalLabel?: boolean
  className?: string
  children: ReactNode
}

export function FormField({
  label,
  error,
  hint,
  required = false,
  optionalLabel = false,
  className,
  children,
}: FormFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <FieldContext value={{ id, describedBy, invalid: Boolean(error), required }}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        <label htmlFor={id} className="text-[13px] font-semibold text-ink">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger-600">
              *
            </span>
          )}
          {optionalLabel && !required && <span className="ml-1 font-normal text-ink-subtle">(opcional)</span>}
        </label>
        {children}
        {error ? (
          <p id={errorId} role="alert" className="text-[13px] text-danger-700">
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="text-[13px] text-ink-muted">
              {hint}
            </p>
          )
        )}
      </div>
    </FieldContext>
  )
}
export const controlClass =
  'h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus:border-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-600/15 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-subtle aria-invalid:border-danger-600 aria-invalid:focus:ring-danger-600/15'
