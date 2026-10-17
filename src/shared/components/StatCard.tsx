import type { LucideIcon } from 'lucide-react'
import type { Tone } from '@/shared/types/common'
import { cn } from '@/shared/utils/cn'

export interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: Extract<Tone, 'brand' | 'warning' | 'danger' | 'neutral'>
}

const iconTones = {
  brand: 'bg-brand-50 text-brand-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  neutral: 'bg-navy-900/6 text-ink-muted',
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand' }: StatCardProps) {
  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-ink-muted">{label}</h2>
        {Icon && (
          <span className={cn('flex size-9 items-center justify-center rounded-control', iconTones[tone])}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="tabular mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-[13px] text-ink-muted">{hint}</p>}
    </section>
  )
}
