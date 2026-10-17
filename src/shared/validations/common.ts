import { z } from 'zod'
import type { DocumentType } from '@/shared/types/common'
import { parseDateOnly } from '@/shared/utils/format'

export const MAX_MONEY_INTEGER_DIGITS = 16
export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
export const EMAIL_MAX_LENGTH = 256

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/
const MAX_MONEY_PATTERN = new RegExp(`^\\d{1,${MAX_MONEY_INTEGER_DIGITS}}(\\.\\d{1,2})?$`)

export function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} es obligatorio.`)
    .max(maxLength, `${label} no puede superar ${maxLength} caracteres.`)
}

export function optionalText(label: string, maxLength: number) {
  return z.string().trim().max(maxLength, `${label} no puede superar ${maxLength} caracteres.`)
}

export const emailField = z
  .string()
  .trim()
  .min(1, 'El correo es obligatorio.')
  .max(EMAIL_MAX_LENGTH, `El correo no puede superar ${EMAIL_MAX_LENGTH} caracteres.`)
  .pipe(z.email('El correo no tiene un formato válido.'))

export function moneyField(label: string, options: { allowZero?: boolean } = {}) {
  return z
    .string()
    .trim()
    .min(1, `${label} es obligatorio.`)
    .refine((value) => MONEY_PATTERN.test(value.replace(/,/g, '')), {
      message: `${label} debe ser un número con hasta dos decimales.`,
    })
    .refine((value) => MAX_MONEY_PATTERN.test(value.replace(/,/g, '')), {
      message: `${label} supera el máximo permitido.`,
    })
    .transform((value) => Number(value.replace(/,/g, '')))
    .refine((value) => (options.allowZero ? value >= 0 : value > 0), {
      message: options.allowZero ? `${label} no puede ser negativo.` : `${label} debe ser mayor que cero.`,
    })
}

export function dateField(label: string) {
  return z
    .string()
    .min(1, `${label} es obligatoria.`)
    .refine((value) => parseDateOnly(value) !== null, { message: `${label} no es válida.` })
}

export const DOCUMENT_MAX_LENGTH = 30

const CEDULA_LENGTH = 11
const RNC_LENGTH = 9
const RNC_WEIGHTS = [7, 9, 8, 6, 5, 4, 3, 2] as const

export function onlyDigits(value: string): string {
  return value.replace(/[\s-]/g, '')
}

export function isValidCedula(value: string): boolean {
  const digits = onlyDigits(value)

  if (!new RegExp(`^\\d{${CEDULA_LENGTH}}$`).test(digits)) {
    return false
  }

  let sum = 0

  for (let index = 0; index < CEDULA_LENGTH - 1; index++) {
    const product = Number(digits[index]) * (index % 2 === 0 ? 1 : 2)
    sum += product > 9 ? product - 9 : product
  }

  return (10 - (sum % 10)) % 10 === Number(digits[CEDULA_LENGTH - 1])
}

export function isValidRnc(value: string): boolean {
  const digits = onlyDigits(value)

  if (!new RegExp(`^\\d{${RNC_LENGTH}}$`).test(digits)) {
    return false
  }

  const sum = RNC_WEIGHTS.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0)
  const remainder = sum % 11
  const expected = remainder === 0 ? 2 : remainder === 1 ? 1 : 11 - remainder

  return expected === Number(digits[RNC_LENGTH - 1])
}

export interface DocumentIssue {
  field: 'documentType' | 'documentNumber'
  message: string
}

export function validateDocument(type: DocumentType | '', number: string): DocumentIssue | null {
  const trimmed = number.trim()

  if (type === '' && trimmed === '') {
    return null
  }

  if (type === '') {
    return { field: 'documentType', message: 'Indique el tipo de documento.' }
  }

  if (trimmed === '') {
    return { field: 'documentNumber', message: 'Indique el número de documento.' }
  }

  if (type === 'CEDULA' && !isValidCedula(trimmed)) {
    return {
      field: 'documentNumber',
      message: 'La cédula debe tener 11 dígitos y un dígito verificador válido.',
    }
  }

  if (type === 'RNC' && !isValidRnc(trimmed)) {
    return { field: 'documentNumber', message: 'El RNC debe tener 9 dígitos y un dígito verificador válido.' }
  }

  if (trimmed.length > DOCUMENT_MAX_LENGTH) {
    return {
      field: 'documentNumber',
      message: `El número de documento no puede superar ${DOCUMENT_MAX_LENGTH} caracteres.`,
    }
  }

  return null
}

export const documentTypeField = z.enum(['', 'CEDULA', 'RNC', 'PASSPORT', 'OTHER'])

export function refineDocument(
  values: { documentType: DocumentType | ''; documentNumber: string },
  context: z.RefinementCtx,
): void {
  const issue = validateDocument(values.documentType, values.documentNumber)

  if (issue) {
    context.addIssue({ code: 'custom', path: [issue.field], message: issue.message })
  }
}

export function documentPayload(type: DocumentType | '', number: string) {
  const trimmed = number.trim()

  return {
    document_type: type === '' ? null : type,
    document_number:
      trimmed === '' ? null : type === 'CEDULA' || type === 'RNC' ? onlyDigits(trimmed) : trimmed,
  }
}

export function optionalEmailField(maxLength = EMAIL_MAX_LENGTH) {
  return z
    .string()
    .trim()
    .max(maxLength, `El correo no puede superar ${maxLength} caracteres.`)
    .refine((value) => value === '' || z.email().safeParse(value).success, {
      message: 'El correo no tiene un formato válido.',
    })
}

export function phoneField(maxLength = 30) {
  return z.string().trim().max(maxLength, `El teléfono no puede superar ${maxLength} caracteres.`)
}

export function nullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function newPasswordField() {
  return z
    .string()
    .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
    .max(PASSWORD_MAX_LENGTH, `La contraseña no puede superar ${PASSWORD_MAX_LENGTH} caracteres.`)
    .refine((value) => value.trim().length > 0, {
      message: 'La contraseña no puede estar formada solo por espacios.',
    })
}

export function passwordContainsEmail(password: string, email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return normalized !== '' && password.toLowerCase().includes(normalized)
}
