import type { Ref, TextareaHTMLAttributes } from 'react'
import { controlClass, useFieldContext } from '@/shared/components/FormField'
import { cn } from '@/shared/utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({ className, id, rows = 3, ref, ...props }: TextareaProps) {
  const field = useFieldContext()

  return (
    <textarea
      ref={ref}
      id={id ?? field?.id}
      rows={rows}
      aria-invalid={field?.invalid ? true : undefined}
      aria-describedby={field?.describedBy}
      aria-required={field?.required ? true : undefined}
      className={cn(controlClass, 'h-auto min-h-20 resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  )
}
