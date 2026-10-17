import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { Spinner } from '@/shared/components/Spinner'
import type { Size } from '@/shared/types/common'
import { cn } from '@/shared/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
  ref?: Ref<HTMLButtonElement>
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/60',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-canvas disabled:text-ink-subtle',
  ghost: 'text-ink-muted hover:bg-navy-900/5 hover:text-ink disabled:text-ink-subtle',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 disabled:bg-danger-600/60',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  type = 'button',
  disabled,
  className,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner label="Procesando" /> : icon}
      {children}
    </button>
  )
}
