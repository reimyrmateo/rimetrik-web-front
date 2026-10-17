import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { useRef } from 'react'
import { cn } from '@/shared/utils/cn'

export interface RowAction {
  label: string
  icon?: LucideIcon
  onSelect: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
  hidden?: boolean
}

export interface RowActionsProps {
  label: string
  actions: readonly RowAction[]
}

export function RowActions({ label, actions }: RowActionsProps) {
  const visible = actions.filter((action) => !action.hidden)
  const selected = useRef(false)

  if (visible.length === 0) {
    return null
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
        className="rounded-control p-2 text-ink-subtle transition-colors hover:bg-canvas hover:text-ink data-[state=open]:bg-canvas"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          onClick={(event) => event.stopPropagation()}
          onCloseAutoFocus={(event) => {
            if (selected.current) {
              event.preventDefault()
              selected.current = false
            }
          }}
          className="z-50 min-w-48 rounded-card border border-line bg-surface p-1.5 shadow-overlay"
        >
          {visible.map(({ label: actionLabel, icon: Icon, onSelect, tone = 'default', disabled }) => (
            <DropdownMenu.Item
              key={actionLabel}
              disabled={disabled}
              onSelect={() => {
                selected.current = true
                onSelect()
              }}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-control px-3 py-2 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-canvas',
                tone === 'danger' ? 'text-danger-700' : 'text-ink',
              )}
            >
              {Icon && <Icon className="size-4 opacity-70" aria-hidden="true" />}
              {actionLabel}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
