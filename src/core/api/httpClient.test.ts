import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureSessionHooks, http, refreshSession, setAccessToken } from '@/core/api/httpClient'
import { ApiError } from '@/core/errors/ApiError'
import { jsonResponse, testUser } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

function headerOf(call: number, name: string): string | null {
  const init = fetchMock.mock.calls[call]?.[1]
  return new Headers(init?.headers).get(name)
}

describe('httpClient', () => {
  const onRefreshed = vi.fn()
  const onExpired = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    configureSessionHooks({ onRefreshed, onExpired })
    setAccessToken('token-viejo')
  })

  afterEach(() => {
    configureSessionHooks(null)
    setAccessToken(null)
    vi.unstubAllGlobals()
  })

  it('sends the access token and the anti-CSRF header, and unwraps the envelope', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { message: 'Obtenido.', data: { id: 7 } }))

    const result = await http.get<{ id: number }>('/projects/7', {
      search: 'torre',
      page: 1,
      status: undefined,
    })

    expect(result).toEqual({ message: 'Obtenido.', data: { id: 7 } })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/projects/7?search=torre&page=1')
    expect(headerOf(0, 'Authorization')).toBe('Bearer token-viejo')
    expect(headerOf(0, 'X-Requested-With')).toBe('XMLHttpRequest')
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('same-origin')
  })

  it('refreshes once on 401 and retries the request with the new token', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Debe iniciar sesión.', data: null }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          message: 'Sesión renovada.',
          data: { access_token: 'token-nuevo', user: testUser },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { message: 'Obtenido.', data: [] }))

    await http.get('/customers')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/auth/refresh')
    expect(headerOf(1, 'Authorization')).toBeNull()
    expect(headerOf(2, 'Authorization')).toBe('Bearer token-nuevo')
    expect(onRefreshed).toHaveBeenCalledWith(testUser)
  })

  it('shares a single refresh between concurrent calls', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        message: 'Sesión renovada.',
        data: { access_token: 'token-nuevo', user: testUser },
      }),
    )

    const [first, second] = await Promise.all([refreshSession(), refreshSession()])

    expect(first).toBe(true)
    expect(second).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('ends the session when the refresh is rejected', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Debe iniciar sesión.', data: null }))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'La sesión expiró.', data: null }))

    await expect(http.get('/customers')).rejects.toMatchObject({ kind: 'unauthorized' })
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('exposes field errors from validation responses', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        message: 'El correo es obligatorio.',
        data: [{ field: 'email', messages: ['El correo es obligatorio.'] }],
      }),
    )

    const error = await http.post('/customers', {}).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'validation', fields: [{ field: 'email' }] })
  })

  it('maps business rules, conflicts and rate limits', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(422, { message: 'Saldo insuficiente.', data: null }))
      .mockResolvedValueOnce(jsonResponse(409, { message: 'Otro usuario guardó antes.', data: null }))
      .mockResolvedValueOnce(
        jsonResponse(429, { message: 'Demasiados intentos.', data: null }, { 'Retry-After': '90' }),
      )

    await expect(http.post('/x')).rejects.toMatchObject({
      kind: 'business_rule',
      message: 'Saldo insuficiente.',
    })
    await expect(http.post('/x')).rejects.toMatchObject({ kind: 'conflict' })
    await expect(http.post('/x')).rejects.toMatchObject({ kind: 'rate_limited', retryAfterSeconds: 90 })
  })

  it('explains that the server is down when the proxy answers 502 without a body', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 502 }))

    await expect(http.post('/auth/login', {})).rejects.toMatchObject({
      kind: 'unavailable',
      message:
        'El servidor de RIMETRIK no está disponible en este momento. Intente de nuevo en unos minutos.',
    })
  })

  it('reports network failures without leaking the original error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(http.get('/customers')).rejects.toMatchObject({ kind: 'network', status: 0 })
  })
})
