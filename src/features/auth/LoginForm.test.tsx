import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '@/app/store/sessionStore'
import { setAccessToken } from '@/core/api/httpClient'
import { LoginForm } from '@/features/auth/LoginForm'
import { jsonResponse, renderWithProviders, testUser } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

function setup(onSuccess = vi.fn()) {
  const view = renderWithProviders(<LoginForm onSuccess={onSuccess} />)
  const email = screen.getByLabelText(/correo electrónico/i)
  const password = screen.getByLabelText(/^contraseña/i)
  const submit = screen.getByRole('button', { name: 'Iniciar sesión' })

  return { ...view, email, password, submit, onSuccess }
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    useSessionStore.getState().signOut()
  })

  afterEach(() => {
    setAccessToken(null)
    vi.unstubAllGlobals()
  })

  it('orders the fields email, password and then the action', () => {
    const { email, password, submit } = setup()

    expect(email).toHaveFocus()
    expect(email.compareDocumentPosition(password) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(password.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(email).toHaveAttribute('autocomplete', 'username')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
  })

  it('requires both fields and does not call the API', async () => {
    const { user, submit, email, password } = setup()

    await user.click(submit)

    expect(await screen.findByText('El correo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a malformed email', async () => {
    const { user, email, password, submit } = setup()

    await user.type(email, 'ana@empresa')
    await user.type(password, 'clave-segura-123')
    await user.click(submit)

    expect(await screen.findByText('El correo no tiene un formato válido.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('waits for the first submit and then revalidates while typing', async () => {
    const { user, email } = setup()

    await user.click(email)
    await user.tab()
    expect(screen.queryByText('El correo es obligatorio.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('El correo es obligatorio.')).toBeInTheDocument()

    await user.type(email, 'ana@rimetrik.test')
    await waitFor(() => expect(screen.queryByText('El correo es obligatorio.')).not.toBeInTheDocument())
  })

  it('limits the length of both fields', () => {
    const { email, password } = setup()

    expect(email).toHaveAttribute('maxlength', '256')
    expect(password).toHaveAttribute('maxlength', '128')
  })

  it('shows and hides the password', async () => {
    const { user, password } = setup()

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('signs in with the trimmed email and keeps the token out of the store', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        message: 'Sesión iniciada.',
        data: {
          access_token: 'token',
          token_type: 'Bearer',
          expires_at: '2026-10-17T05:00:00Z',
          user: testUser,
        },
      }),
    )
    const { user, email, password, submit, onSuccess } = setup()

    await user.type(email, '  ana@rimetrik.test ')
    await user.type(password, 'clave-segura-123')
    await user.click(submit)

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<string, string>
    expect(body).toEqual({ email: 'ana@rimetrik.test', password: 'clave-segura-123' })
    expect(useSessionStore.getState().user).toEqual(testUser)
    expect(JSON.stringify(useSessionStore.getState())).not.toContain('token')
  })

  it('shows the server message for wrong credentials', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { message: 'Correo o contraseña incorrectos.', data: null }),
    )
    const { user, email, password, submit, onSuccess } = setup()

    await user.type(email, 'ana@rimetrik.test')
    await user.type(password, 'equivocada')
    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(onSuccess).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('tells the user how long to wait after too many attempts', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(429, { message: 'Demasiados intentos.', data: null }, { 'Retry-After': '120' }),
    )
    const { user, email, password, submit } = setup()

    await user.type(email, 'ana@rimetrik.test')
    await user.type(password, 'equivocada')
    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Demasiados intentos. Intente de nuevo en 2 minutos.',
    )
  })

  it('places server field errors under their input', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        message: 'El correo no tiene un formato válido.',
        data: [{ field: 'email', messages: ['El correo no tiene un formato válido.'] }],
      }),
    )
    const { user, email, password, submit } = setup()

    await user.type(email, 'ana@rimetrik.test')
    await user.type(password, 'clave')
    await user.click(submit)

    expect(await screen.findByText('El correo no tiene un formato válido.')).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'true')
  })
})
