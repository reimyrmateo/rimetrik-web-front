import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RoleForm } from '@/features/users/RoleForm'
import type { PermissionInfo, Role } from '@/features/users/userTypes'
import { jsonResponse, renderWithProviders } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

const catalog: PermissionInfo[] = [
  { code: 'users.view', description: 'Ver usuarios' },
  { code: 'users.manage', description: 'Administrar usuarios' },
  { code: 'projects.view', description: 'Ver proyectos' },
  { code: 'costs.view', description: 'Ver gastos' },
  { code: 'payments.manage', description: 'Registrar obligaciones, pagos y transferencias' },
]

const role: Role = {
  id: 5,
  name: 'Contabilidad',
  description: 'Registra gastos',
  is_system: false,
  permissions: ['costs.view'],
  user_count: 2,
  row_version: 'AAAAAAAAD1E=',
}

function respond(extra?: (input: string, init?: RequestInit) => Response | undefined) {
  fetchMock.mockImplementation((input, init) => {
    const url = input as string
    const custom = extra?.(url, init)

    if (custom) {
      return Promise.resolve(custom)
    }

    return Promise.resolve(
      url === '/api/permissions'
        ? jsonResponse(200, { message: 'OK', data: catalog })
        : jsonResponse(404, { message: 'No encontrado.', data: null }),
    )
  })
}

function sentTo(url: string): unknown {
  const call = fetchMock.mock.calls.find(([input]) => (input as string) === url)
  return JSON.parse(call?.[1]?.body as string)
}

describe('RoleForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    respond()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('groups the permissions by area and orders name, description and permissions', async () => {
    renderWithProviders(<RoleForm onSaved={vi.fn()} onCancel={vi.fn()} />)
    const name = screen.getByLabelText(/nombre del rol/i)
    const description = screen.getByLabelText(/descripción/i)
    const firstPermission = await screen.findByLabelText('Ver usuarios')

    expect(name).toHaveFocus()
    expect(name).toHaveAttribute('maxlength', '60')
    expect(description).toHaveAttribute('maxlength', '300')
    expect(
      description.compareDocumentPosition(firstPermission) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByLabelText('Usuarios y seguridad')).toBeInTheDocument()
    expect(screen.getByLabelText('Gastos y pagos')).toBeInTheDocument()
  })

  it('requires a name and at least one permission', async () => {
    const { user } = renderWithProviders(<RoleForm onSaved={vi.fn()} onCancel={vi.fn()} />)
    await screen.findByLabelText('Ver usuarios')

    await user.type(screen.getByLabelText(/nombre del rol/i), '   ')
    await user.click(screen.getByRole('button', { name: 'Crear rol' }))

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('Asigne al menos un permiso al rol.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([input]) => (input as string) === '/api/roles')).toBe(false)
  })

  it('selects a whole group and marks it as partial when one is removed', async () => {
    const { user } = renderWithProviders(<RoleForm onSaved={vi.fn()} onCancel={vi.fn()} />)
    const group = await screen.findByLabelText<HTMLInputElement>('Gastos y pagos')

    await user.click(group)
    expect(screen.getByLabelText('Ver gastos')).toBeChecked()
    expect(screen.getByLabelText('Registrar obligaciones, pagos y transferencias')).toBeChecked()
    expect(screen.getByText('2 seleccionados')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Ver gastos'))
    expect(group.checked).toBe(false)
    expect(group.indeterminate).toBe(true)
  })

  it('creates the role with null description when it is empty', async () => {
    respond((url, init) =>
      url === '/api/roles' && init?.method === 'POST'
        ? jsonResponse(201, { message: 'Rol creado.', data: role })
        : undefined,
    )
    const onSaved = vi.fn()
    const { user } = renderWithProviders(<RoleForm onSaved={onSaved} onCancel={vi.fn()} />)

    await user.type(screen.getByLabelText(/nombre del rol/i), ' Residente de obra ')
    await user.click(await screen.findByLabelText('Ver proyectos'))
    await user.click(screen.getByRole('button', { name: 'Crear rol' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Rol creado.'))
    expect(sentTo('/api/roles')).toEqual({
      name: 'Residente de obra',
      description: null,
      permissions: ['projects.view'],
    })
  })

  it('edits with the row version it read', async () => {
    respond((url, init) =>
      url === '/api/roles/5' && init?.method === 'PUT'
        ? jsonResponse(200, { message: 'Rol actualizado.', data: role })
        : undefined,
    )
    const onSaved = vi.fn()
    const { user } = renderWithProviders(<RoleForm role={role} onSaved={onSaved} onCancel={vi.fn()} />)

    expect(await screen.findByLabelText('Ver gastos')).toBeChecked()
    await user.click(screen.getByLabelText('Ver usuarios'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Rol actualizado.'))
    expect(sentTo('/api/roles/5')).toEqual({
      name: 'Contabilidad',
      description: 'Registra gastos',
      permissions: ['costs.view', 'users.view'],
      row_version: 'AAAAAAAAD1E=',
    })
  })

  it('shows the system role read only', async () => {
    renderWithProviders(
      <RoleForm
        role={{ ...role, is_system: true, name: 'Administrador' }}
        readOnly
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByText(/es el rol de sistema/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre del rol/i)).toBeDisabled()
    expect(await screen.findByLabelText('Ver gastos')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('form')).getByRole('button', { name: 'Cerrar' })).toBeEnabled()
  })
})
