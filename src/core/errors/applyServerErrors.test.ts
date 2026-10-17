import { describe, expect, it, vi } from 'vitest'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import { ApiError } from '@/core/errors/ApiError'

describe('applyServerErrors', () => {
  it('maps snake_case and indexed fields to the form paths', () => {
    const setError = vi.fn()
    const error = new ApiError('Datos inválidos.', 400, [
      { field: 'new_password', messages: ['La contraseña debe tener al menos 12 caracteres.'] },
      { field: 'lines[0].expense_category_id', messages: ['La categoría no existe.'] },
    ])

    const message = applyServerErrors(error, setError, ['newPassword', 'lines.0.expenseCategoryId'])

    expect(message).toBeNull()
    expect(setError).toHaveBeenCalledWith(
      'newPassword',
      { type: 'server', message: 'La contraseña debe tener al menos 12 caracteres.' },
      { shouldFocus: true },
    )
    expect(setError).toHaveBeenCalledWith(
      'lines.0.expenseCategoryId',
      { type: 'server', message: 'La categoría no existe.' },
      { shouldFocus: true },
    )
  })

  it('returns the message of fields the form does not show', () => {
    const setError = vi.fn()
    const error = new ApiError('Datos inválidos.', 400, [
      { field: 'body', messages: ['El valor enviado no es válido.'] },
    ])

    expect(applyServerErrors(error, setError, ['email'])).toBe('El valor enviado no es válido.')
    expect(setError).not.toHaveBeenCalled()
  })

  it('returns the general message for errors without fields', () => {
    expect(applyServerErrors(new ApiError('Saldo insuficiente.', 422), vi.fn(), [])).toBe(
      'Saldo insuficiente.',
    )
  })

  it('ignores errors that do not come from the API', () => {
    expect(applyServerErrors(new Error('boom'), vi.fn(), [])).toBeNull()
  })
})
