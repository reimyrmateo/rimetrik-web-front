import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}

const styles: Record<AlertTone, { box: string; icon: typeof Info }> = {
  info: { box: 'border-info-700/15 bg-info-50 text-info-700', icon: Info },
  success: { box: 'border-success-700/15 bg-success-50 text-success-700', icon: CheckCircle2 },
  warning: { box: 'border-warning-700/20 bg-warning-50 text-warning-700', icon: AlertTriangle },
  danger: { box: 'border-danger-700/15 bg-danger-50 text-danger-700', icon: XCircle },
}

export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const { box, icon: Icon } = styles[tone]

  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-control border px-4 py-3 text-sm', box, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-ink/80')}>{children}</div>}
      </div>
      {action}
    </div>
  )
}
