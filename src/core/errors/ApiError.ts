import type { ServerFieldError } from '@/core/api/apiTypes'

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'business_rule'
  | 'rate_limited'
  | 'server'
  | 'unavailable'
  | 'network'

const kindByStatus: Record<number, ApiErrorKind> = {
  400: 'validation',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'business_rule',
  429: 'rate_limited',
  502: 'unavailable',
  503: 'unavailable',
  504: 'unavailable',
}

export const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.'
export const UNAVAILABLE_MESSAGE =
  'El servidor de RIMETRIK no está disponible en este momento. Intente de nuevo en unos minutos.'
export const UNEXPECTED_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intente de nuevo en unos minutos.'

export class ApiError extends Error {
  readonly status: number
  readonly kind: ApiErrorKind
  readonly fields: ServerFieldError[]
  readonly retryAfterSeconds: number | null

  constructor(
    message: string,
    status: number,
    fields: ServerFieldError[] = [],
    retryAfterSeconds: number | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = status === 0 ? 'network' : (kindByStatus[status] ?? 'server')
    this.fields = fields
    this.retryAfterSeconds = retryAfterSeconds
  }

  get isConcurrencyConflict(): boolean {
    return this.kind === 'conflict'
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function errorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }

  return UNEXPECTED_ERROR_MESSAGE
}
