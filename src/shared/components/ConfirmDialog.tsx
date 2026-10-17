import type { ReactNode } from 'react'
import { Button, type ButtonVariant } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  variant?: Extract<ButtonVariant, 'primary' | 'danger'>
  loading?: boolean
  onConfirm: () => void
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'primary',
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      dismissible={!loading}
      {...(description ? { description } : {})}
      footer={
        <>
          <Button variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant={variant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
