import * as Toast from '@radix-ui/react-toast'
import { CheckCircle2, X, XCircle } from 'lucide-react'
import { create } from 'zustand'
import { TOAST_DURATION_MS } from '@/shared/constants/ui'
import { cn } from '@/shared/utils/cn'

type ToastTone = 'success' | 'error'

interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

interface ToastState {
  items: ToastItem[]
  push: (tone: ToastTone, message: string) => void
  dismiss: (id: number) => void
}

let nextId = 0

const useToastStore = create<ToastState>()((set) => ({
  items: [],
  push: (tone, message) => set((state) => ({ items: [...state.items, { id: ++nextId, tone, message }] })),
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}))

export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
}

export function Toaster() {
  const items = useToastStore((state) => state.items)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <Toast.Provider duration={TOAST_DURATION_MS} swipeDirection="right" label="Notificaciones">
      {items.map((item) => {
        const Icon = item.tone === 'success' ? CheckCircle2 : XCircle

        return (
          <Toast.Root
            key={item.id}
            type={item.tone === 'error' ? 'foreground' : 'background'}
            onOpenChange={(open) => {
              if (!open) {
                dismiss(item.id)
              }
            }}
            className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-overlay"
          >
            <Icon
              aria-hidden="true"
              className={cn(
                'mt-0.5 size-4 shrink-0',
                item.tone === 'success' ? 'text-brand-600' : 'text-danger-600',
              )}
            />
            <Toast.Description className="flex-1 text-sm text-ink">{item.message}</Toast.Description>
            <Toast.Close
              aria-label="Cerrar notificación"
              className="rounded-control p-1 text-ink-subtle hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </Toast.Close>
          </Toast.Root>
        )
      })}
      <Toast.Viewport className="fixed right-4 bottom-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 outline-none" />
    </Toast.Provider>
  )
}
