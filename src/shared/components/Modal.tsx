import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

const FIRST_FIELD =
  'input:not([type=hidden]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
  dismissible?: boolean
  children?: ReactNode
}

const widths = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  footer,
  dismissible = true,
  children,
}: ModalProps) {
  const focusFirstField = (event: Event) => {
    const content = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
    const field = content?.querySelector<HTMLElement>(FIRST_FIELD)

    if (field) {
      event.preventDefault()
      field.focus()
    }
  }

  const block = (event: Event) => {
    if (!dismissible) {
      event.preventDefault()
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (dismissible || next) {
          onOpenChange(next)
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-navy-950/45 backdrop-blur-[2px]" />
        <Dialog.Content
          onOpenAutoFocus={focusFirstField}
          onEscapeKeyDown={block}
          onPointerDownOutside={block}
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-card bg-surface shadow-overlay focus:outline-none',
            widths[size],
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 pt-5 pb-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-ink-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            {dismissible && (
              <Dialog.Close
                aria-label="Cerrar"
                className="-mr-2 rounded-control p-2 text-ink-subtle transition-colors hover:bg-canvas hover:text-ink"
              >
                <X className="size-4" aria-hidden="true" />
              </Dialog.Close>
            )}
          </header>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <footer className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
