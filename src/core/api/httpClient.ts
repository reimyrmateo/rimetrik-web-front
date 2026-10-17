import type { ApiEnvelope, ApiResult, QueryParams, ServerFieldError } from '@/core/api/apiTypes'
import type { AccessTokenResponse, CurrentUser } from '@/core/auth/authTypes'
import { env } from '@/core/config/env'
import {
  ApiError,
  NETWORK_ERROR_MESSAGE,
  UNAVAILABLE_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
} from '@/core/errors/ApiError'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: QueryParams
  signal?: AbortSignal
  authenticated?: boolean
}

interface SessionHooks {
  onRefreshed: (user: CurrentUser) => void
  onExpired: () => void
}

const REFRESH_PATH = '/auth/refresh'

let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null
let sessionHooks: SessionHooks | null = null

export function configureSessionHooks(hooks: SessionHooks | null): void {
  sessionHooks = hooks
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function hasAccessToken(): boolean {
  return accessToken !== null
}

export function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${env.apiBasePath}${path}`, window.location.origin)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return `${url.pathname}${url.search}`
}

function retryAfter(response: Response): number | null {
  const header = response.headers.get('Retry-After')
  const seconds = header === null ? Number.NaN : Number.parseInt(header, 10)

  return Number.isFinite(seconds) ? seconds : null
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const contentType = response.headers.get('Content-Type') ?? ''

  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return (await response.json()) as ApiEnvelope<T>
  } catch {
    return null
  }
}

function toError(response: Response, envelope: ApiEnvelope<unknown> | null): ApiError {
  const fields =
    response.status === 400 && Array.isArray(envelope?.data) ? (envelope.data as ServerFieldError[]) : []

  const fallback =
    response.status >= 502 && response.status <= 504 ? UNAVAILABLE_MESSAGE : UNEXPECTED_ERROR_MESSAGE

  return new ApiError(envelope?.message ?? fallback, response.status, fields, retryAfter(response))
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' })

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.authenticated !== false && accessToken !== null) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? null : JSON.stringify(options.body),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: options.signal ?? null,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new ApiError(NETWORK_ERROR_MESSAGE, 0)
  }
}

export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const response = await send(REFRESH_PATH, { method: 'POST', authenticated: false })
      const envelope = await readEnvelope<AccessTokenResponse>(response)

      if (!response.ok || !envelope?.data) {
        accessToken = null
        return false
      }

      accessToken = envelope.data.access_token
      sessionHooks?.onRefreshed(envelope.data.user)
      return true
    } catch {
      accessToken = null
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  let response = await send(path, options)

  if (response.status === 401 && options.authenticated !== false) {
    if (await refreshSession()) {
      response = await send(path, options)
    } else {
      sessionHooks?.onExpired()
    }
  }

  const envelope = await readEnvelope<T>(response)

  if (!response.ok) {
    throw toError(response, envelope)
  }

  return { message: envelope?.message ?? '', data: envelope?.data as T }
}

export const http = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
    request<T>(path, { query, ...(signal ? { signal } : {}) }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
