import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { PermissionRoute } from '@/app/router/PermissionRoute'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { useSessionStore } from '@/app/store/sessionStore'
import { PERMISSIONS } from '@/core/constants/permissions'
import { signInAs, testUser } from '@/test/helpers/renderWithProviders'

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <p>Pantalla de acceso</p> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/cuenta', element: <p>Contenido privado</p> },
          {
            element: <PermissionRoute requires={PERMISSIONS.costs.view} />,
            children: [{ path: '/gastos', element: <p>Gastos</p> }],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  )

  render(<RouterProvider router={router} />)
  return router
}

describe('ProtectedRoute', () => {
  beforeEach(() => useSessionStore.setState({ status: 'checking', user: null, notice: null }))

  it('waits while the session is being restored', () => {
    renderAt('/cuenta')

    expect(screen.getByRole('status')).toHaveTextContent('Verificando la sesión')
  })

  it('sends anonymous visitors to the login and remembers where they were going', () => {
    signInAs(null)
    const router = renderAt('/cuenta?tab=clave')

    expect(screen.getByText('Pantalla de acceso')).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ from: '/cuenta?tab=clave' })
  })

  it('shows private pages to signed-in users', () => {
    signInAs()
    renderAt('/cuenta')

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })

  it('hides sections the user has no permission for', () => {
    signInAs({ ...testUser, permissions: [] })
    renderAt('/gastos')

    expect(screen.getByText('No tiene permiso para ver esta sección')).toBeInTheDocument()
    expect(screen.queryByText('Gastos')).not.toBeInTheDocument()
  })
})
