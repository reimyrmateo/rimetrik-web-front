import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { createQueryClient } from '@/app/providers/queryClient'
import { useSessionBootstrap } from '@/core/auth/useSession'
import { Toaster } from '@/shared/components/Toaster'

function SessionBootstrap({ children }: { children: ReactNode }) {
  useSessionBootstrap()
  return children
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap>{children}</SessionBootstrap>
      <Toaster />
    </QueryClientProvider>
  )
}
