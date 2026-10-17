import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PERMISSIONS } from '@/core/constants/permissions'
import { ResetPasswordForm, UserForm } from '@/features/users/UserForm'
import type { Role, UserDetails } from '@/features/users/userTypes'
import { jsonResponse, renderWithProviders, signInAs, testUser } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

const roles: Role[] = [
  {
    id: 1,
    name: 'Administrador',
    description: 'Acceso total',
    is_system: true,
    permissions: [],
    user_count: 1,
    row_version: 'AAAAAAAAA1E=',
  },
  {
    id: 2,
    name: 'Residente',
    description: null,
    is_system: false,
    permissions: [],
    user_count: 0,
    row_version: 'AAAAAAAAA1F=',
  },
]

const existing: UserDetails = {
  id: 7,
  full_name: 'Luis Gómez',
  email: 'luis@rimetrik.test',
  is_active: true,
  roles: [{ id: 2, name: 'Residente' }],
  last_login_at: null,
  lockout_end: null,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: null,
  row_version: 'AAAAAAAAB9E=',
}

type Handler = (body: unknown) => Response

function routeFetch(handlers: Record<string, Handler>) {
  fetchMock.mockImplementation((input, init) => {
    const method = init?.method ?? 'GET'
    const handler = handlers[`${method} ${input as string}`]
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined

    return Promise.resolve(
      handler ? handler(body) : jsonResponse(404, { message: 'No encontrado.', data: null }),
    )
  })
}

function calls(method: string, url: string) {
  return fetchMock.mock.calls.filter(
    ([input, init]) => (input as string) === url && (init?.method ?? 'GET') === method,
  )
}

function bodyOf(method: string, url: string): unknown {
  return JSON.parse(calls(method, url)[0]?.[1]?.body as string)
}

describe('UserForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    signInAs({ ...testUser, permissions: [PERMISSIONS.users.manage, PERMISSIONS.roles.view] })
    routeFetch({ 'GET /api/roles': () => jsonResponse(200, { message: 'OK', data: roles }) })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('orders identity, credentials and roles', async () => {
    renderWithProviders(<UserForm onSaved={vi.fn()} onCancel={vi.fn()} />)
    const order = [
      screen.getByLabelText(/nombre completo/i),
      screen.getByLabelText(/correo electrónico/i),
      screen.getByLabelText(/contraseña inicial/i),
      screen.getByLabelText(/confirmar contraseña/i),
      await screen.findByLabelText('Administrador'),
    ]

    for (let index = 1; index < order.length; index++) {
      expect(
        order[index - 1]!.compareDocumentPosition(order[index]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }

    expect(order[0]).toHaveFocus()
    expect(order[0]).toHaveAttribute('maxlength', '150')
    expect(order[1]).toHaveAttribute('maxlength', '256')
    expect(order[2]).toHaveAttribute('type', 'password')
  })

  it('requires every field and at least one role', async () => {
    const { user } = renderWithProviders(<UserForm onSaved={vi.fn()} onCancel={vi.fn()} />)
    await screen.findByLabelText('Residente')

    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña debe tener al menos 12 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('Confirme la contraseña.')).toBeInTheDocument()
    expect(screen.getByText('Asigne al menos un rol.')).toBeInTheDocument()
    expect(calls('POST', '/api/users')).toHaveLength(0)
  })

  it('rejects weak passwords, a password with the email and a mismatched confirmation', async () => {
    const { user } = renderWithProviders(<UserForm onSaved={vi.fn()} onCancel={vi.fn()} />)
    const password = screen.getByLabelText(/contraseña inicial/i)
    const confirm = screen.getByLabelText(/confirmar contraseña/i)
    const submit = screen.getByRole('button', { name: 'Crear usuario' })

    await user.type(screen.getByLabelText(/correo electrónico/i), 'Luis@Rimetrik.test')
    await user.type(password, '            ')
    await user.click(submit)
    expect(
      await screen.findByText('La contraseña no puede estar formada solo por espacios.'),
    ).toBeInTheDocument()

    await user.clear(password)
    await user.type(password, 'xx-luis@rimetrik.test')
    await user.type(confirm, 'otra-distinta-123')
    await user.click(submit)

    expect(
      await screen.findByText('La contraseña no puede contener el correo del usuario.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
  })

  it('creates the user with the selected roles as numbers', async () => {
    routeFetch({
      'GET /api/roles': () => jsonResponse(200, { message: 'OK', data: roles }),
      'POST /api/users': () => jsonResponse(201, { message: 'Usuario creado.', data: existing }),
    })
    const onSaved = vi.fn()
    const { user } = renderWithProviders(<UserForm onSaved={onSaved} onCancel={vi.fn()} />)

    await user.type(screen.getByLabelText(/nombre completo/i), ' Luis Gómez ')
    await user.type(screen.getByLabelText(/correo electrónico/i), 'luis@rimetrik.test')
    await user.type(screen.getByLabelText(/contraseña inicial/i), 'Obra-Segura-2026')
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Obra-Segura-2026')
    await user.click(await screen.findByLabelText('Residente'))
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Usuario creado.'))
    expect(bodyOf('POST', '/api/users')).toEqual({
      full_name: 'Luis Gómez',
      email: 'luis@rimetrik.test',
      password: 'Obra-Segura-2026',
      role_ids: [2],
    })
  })

  it('cannot create without permission to see roles', () => {
    signInAs({ ...testUser, permissions: [PERMISSIONS.users.manage] })
    renderWithProviders(<UserForm onSaved={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByText('Para asignar roles necesita el permiso de ver roles.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear usuario' })).toBeDisabled()
    expect(calls('GET', '/api/roles')).toHaveLength(0)
  })

  it('edits without password fields and only saves after a change', async () => {
    renderWithProviders(<UserForm user={existing} onSaved={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument()
    expect(await screen.findByLabelText('Residente')).toBeChecked()
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('sends only the roles when only the roles changed', async () => {
    routeFetch({
      'GET /api/roles': () => jsonResponse(200, { message: 'OK', data: roles }),
      'PUT /api/users/7/roles': () => jsonResponse(200, { message: 'Roles actualizados.', data: existing }),
    })
    const onSaved = vi.fn()
    const { user } = renderWithProviders(<UserForm user={existing} onSaved={onSaved} onCancel={vi.fn()} />)

    await user.click(await screen.findByLabelText('Administrador'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Roles actualizados.'))
    expect(calls('PUT', '/api/users/7')).toHaveLength(0)
    expect(bodyOf('PUT', '/api/users/7/roles')).toEqual({ role_ids: [1, 2] })
  })

  it('keeps the new row version when the roles fail after the profile was saved', async () => {
    let rolesAttempts = 0
    routeFetch({
      'GET /api/roles': () => jsonResponse(200, { message: 'OK', data: roles }),
      'PUT /api/users/7': () =>
        jsonResponse(200, {
          message: 'Usuario actualizado.',
          data: { ...existing, full_name: 'Luis A. Gómez', row_version: 'AAAAAAAAC1E=' },
        }),
      'PUT /api/users/7/roles': () => {
        rolesAttempts++
        return rolesAttempts === 1
          ? jsonResponse(422, {
              message: 'El sistema debe conservar al menos un administrador activo.',
              data: null,
            })
          : jsonResponse(200, { message: 'Roles actualizados.', data: existing })
      },
    })
    const onSaved = vi.fn()
    const { user } = renderWithProviders(<UserForm user={existing} onSaved={onSaved} onCancel={vi.fn()} />)
    const name = screen.getByLabelText(/nombre completo/i)

    await user.clear(name)
    await user.type(name, 'Luis A. Gómez')
    await user.click(await screen.findByLabelText('Administrador'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      await screen.findByText('El sistema debe conservar al menos un administrador activo.'),
    ).toBeInTheDocument()
    expect(bodyOf('PUT', '/api/users/7')).toEqual({
      full_name: 'Luis A. Gómez',
      email: 'luis@rimetrik.test',
      row_version: 'AAAAAAAAB9E=',
    })

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Roles actualizados.'))
    expect(calls('PUT', '/api/users/7')).toHaveLength(1)
  })

  it('shows a duplicated email from the server', async () => {
    routeFetch({
      'GET /api/roles': () => jsonResponse(200, { message: 'OK', data: roles }),
      'PUT /api/users/7': () =>
        jsonResponse(409, { message: 'Ya existe un usuario con ese correo.', data: null }),
    })
    const { user } = renderWithProviders(<UserForm user={existing} onSaved={vi.fn()} onCancel={vi.fn()} />)
    const email = screen.getByLabelText(/correo electrónico/i)

    await user.clear(email)
    await user.type(email, 'otro@rimetrik.test')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Ya existe un usuario con ese correo.')).toBeInTheDocument()
  })
})

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('validates the new password and its confirmation', async () => {
    const { user } = renderWithProviders(
      <ResetPasswordForm user={existing} onSaved={vi.fn()} onCancel={vi.fn()} />,
    )
    const password = screen.getByLabelText(/contraseña nueva/i)
    const submit = screen.getByRole('button', { name: 'Restablecer contraseña' })

    expect(password).toHaveFocus()
    await user.click(submit)
    expect(await screen.findByText('La contraseña debe tener al menos 12 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('Confirme la contraseña.')).toBeInTheDocument()

    await user.type(password, 'LUIS@rimetrik.test!')
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'otra')
    await user.click(submit)

    expect(
      await screen.findByText('La contraseña no puede contener el correo del usuario.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the new password to the reset endpoint', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { message: 'Contraseña restablecida.', data: existing }),
    )
    const onSaved = vi.fn()
    const { user } = renderWithProviders(
      <ResetPasswordForm user={existing} onSaved={onSaved} onCancel={vi.fn()} />,
    )

    await user.type(screen.getByLabelText(/contraseña nueva/i), 'Nueva-Clave-2026')
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Nueva-Clave-2026')
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Contraseña restablecida.'))
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/users/7/reset-password')
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      new_password: 'Nueva-Clave-2026',
    })
  })
})
