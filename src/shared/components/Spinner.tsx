import { cn } from '@/shared/utils/cn'

interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Cargando' }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex items-center', className)}>
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
