import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { useSessionStore } from '@/app/store/sessionStore'
import type { CurrentUser } from '@/core/auth/authTypes'

export const testUser: CurrentUser = {
  id: 1,
  full_name: 'Ana Pérez',
  email: 'ana@rimetrik.test',
  roles: ['Administrador'],
  permissions: [],
}

export function signInAs(user: CurrentUser | null = testUser): void {
  if (user) {
    useSessionStore.getState().signIn(user)
  } else {
    useSessionStore.getState().signOut()
  }
}

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  path?: string
  initialEntries?: string[]
  extraRoutes?: { path: string; element: ReactElement }[]
}

export function renderWithProviders(ui: ReactElement, options: ProviderOptions = {}) {
  const { path = '/', initialEntries = [path], extraRoutes = [], ...renderOptions } = options
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter([{ path, element: ui }, ...extraRoutes], { initialEntries })

  return {
    user: userEvent.setup(),
    router,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
      renderOptions,
    ),
  }
}

export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}
