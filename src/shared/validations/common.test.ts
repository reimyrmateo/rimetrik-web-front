import { describe, expect, it } from 'vitest'
import { dateField, emailField, moneyField, requiredText } from '@/shared/validations/common'

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message

describe('common validations', () => {
  it('validates money with up to two decimals', () => {
    const amount = moneyField('El importe')

    expect(amount.parse('1,250.50')).toBe(1250.5)
    expect(firstMessage(amount.safeParse(''))).toBe('El importe es obligatorio.')
    expect(firstMessage(amount.safeParse('10.555'))).toBe(
      'El importe debe ser un número con hasta dos decimales.',
    )
    expect(firstMessage(amount.safeParse('-5'))).toBe(
      'El importe debe ser un número con hasta dos decimales.',
    )
    expect(firstMessage(amount.safeParse('0'))).toBe('El importe debe ser mayor que cero.')
    expect(firstMessage(amount.safeParse('12345678901234567'))).toBe('El importe supera el máximo permitido.')
    expect(moneyField('El saldo', { allowZero: true }).parse('0')).toBe(0)
  })

  it('validates emails and required texts', () => {
    expect(firstMessage(emailField.safeParse('   '))).toBe('El correo es obligatorio.')
    expect(firstMessage(emailField.safeParse('ana@'))).toBe('El correo no tiene un formato válido.')
    expect(emailField.parse('  ana@rimetrik.test ')).toBe('ana@rimetrik.test')
    expect(firstMessage(requiredText('El nombre', 5).safeParse('Constructora'))).toBe(
      'El nombre no puede superar 5 caracteres.',
    )
  })

  it('validates calendar dates', () => {
    const date = dateField('La fecha')

    expect(firstMessage(date.safeParse(''))).toBe('La fecha es obligatoria.')
    expect(firstMessage(date.safeParse('2026-02-30'))).toBe('La fecha no es válida.')
    expect(date.parse('2026-10-16')).toBe('2026-10-16')
  })
})
