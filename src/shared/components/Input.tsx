import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { controlClass, useFieldContext } from '@/shared/components/FormField'
import { cn } from '@/shared/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leading?: ReactNode
  trailing?: ReactNode
  ref?: Ref<HTMLInputElement>
}

export function Input({ leading, trailing, className, id, ref, ...props }: InputProps) {
  const field = useFieldContext()

  const input = (
    <input
      ref={ref}
      id={id ?? field?.id}
      aria-invalid={field?.invalid ? true : undefined}
      aria-describedby={field?.describedBy}
      aria-required={field?.required ? true : undefined}
      className={cn(
        controlClass,
        leading !== undefined && 'pl-10',
        trailing !== undefined && 'pr-10',
        className,
      )}
      {...props}
    />
  )

  if (leading === undefined && trailing === undefined) {
    return input
  }

  return (
    <div className="relative">
      {leading !== undefined && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-subtle">
          {leading}
        </span>
      )}
      {input}
      {trailing !== undefined && (
        <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>
      )}
    </div>
  )
}
