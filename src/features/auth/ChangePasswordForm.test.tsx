import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '@/app/store/sessionStore'
import { PASSWORD_CHANGED_NOTICE } from '@/core/auth/useSession'
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm'
import { jsonResponse, renderWithProviders, signInAs, testUser } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()
const VALID = 'Obra-Segura-2026'

function setup() {
  const view = renderWithProviders(<ChangePasswordForm email={testUser.email} />)

  return {
    ...view,
    current: screen.getByLabelText(/contraseña actual/i),
    next: screen.getByLabelText(/^contraseña nueva/i),
    confirm: screen.getByLabelText(/confirmar contraseña nueva/i),
    submit: screen.getByRole('button', { name: 'Actualizar contraseña' }),
  }
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    signInAs()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('requires every field', async () => {
    const { user, submit } = setup()

    await user.click(submit)

    expect(await screen.findByText('La contraseña actual es obligatoria.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña debe tener al menos 12 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('Confirme la contraseña nueva.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requires at least 12 characters', async () => {
    const { user, current, next, confirm, submit } = setup()

    await user.type(current, 'actual-1234567')
    await user.type(next, 'corta123')
    await user.type(confirm, 'corta123')
    await user.click(submit)

    expect(await screen.findByText('La contraseña debe tener al menos 12 caracteres.')).toBeInTheDocument()
  })

  it('rejects passwords made only of spaces', async () => {
    const { user, current, next, confirm, submit } = setup()

    await user.type(current, 'actual-1234567')
    await user.type(next, '              ')
    await user.type(confirm, '              ')
    await user.click(submit)

    expect(
      await screen.findByText('La contraseña no puede estar formada solo por espacios.'),
    ).toBeInTheDocument()
  })

  it('rejects passwords that contain the email, ignoring case', async () => {
    const { user, current, next, confirm, submit } = setup()

    await user.type(current, 'actual-1234567')
    await user.type(next, 'X-ANA@RIMETRIK.TEST-1')
    await user.type(confirm, 'X-ANA@RIMETRIK.TEST-1')
    await user.click(submit)

    expect(await screen.findByText('La contraseña no puede contener su correo.')).toBeInTheDocument()
  })

  it('requires a new password different from the current one', async () => {
    const { user, current, next, confirm, submit } = setup()

    await user.type(current, VALID)
    await user.type(next, VALID)
    await user.type(confirm, VALID)
    await user.click(submit)

    expect(await screen.findByText('La contraseña nueva debe ser distinta de la actual.')).toBeInTheDocument()
  })

  it('requires the confirmation to match', async () => {
    const { user, current, next, confirm, submit } = setup()

    await user.type(current, 'actual-1234567')
    await user.type(next, VALID)
    await user.type(confirm, `${VALID}x`)
    await user.click(submit)

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('limits the length to 128 characters', () => {
    const { current, next, confirm } = setup()

    for (const input of [current, next, confirm]) {
      expect(input).toHaveAttribute('maxlength', '128')
    }
  })

  it('shows a wrong current password under its field', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        message: 'La contraseña actual no es correcta.',
        data: [{ field: 'current_password', messages: ['La contraseña actual no es correcta.'] }],
      }),
    )
    const { user, current, next, confirm, submit } = setup()

    await user.type(current, 'actual-1234567')
    await user.type(next, VALID)
    await user.type(confirm, VALID)
    await user.click(submit)

    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeInTheDocument()
    expect(current).toHaveAttribute('aria-invalid', 'true')
    expect(useSessionStore.getState().status).toBe('authenticated')
  })

  it('sends only the current and new password, then ends the session', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { message: 'Contraseña actualizada.', data: null }))
    const { user, current, next, confirm, submit } = setup()

    await user.type(current, 'actual-1234567')
    await user.type(next, VALID)
    await user.type(confirm, VALID)
    await user.click(submit)

    await waitFor(() => expect(useSessionStore.getState().status).toBe('anonymous'))
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      current_password: 'actual-1234567',
      new_password: VALID,
    })
    expect(useSessionStore.getState().notice).toBe(PASSWORD_CHANGED_NOTICE)
  })
})
