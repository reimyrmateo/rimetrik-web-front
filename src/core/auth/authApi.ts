import { http, refreshSession, request, setAccessToken } from '@/core/api/httpClient'
import type {
  AccessTokenResponse,
  ChangePasswordPayload,
  CurrentUser,
  LoginPayload,
} from '@/core/auth/authTypes'

export const authApi = {
  async login(payload: LoginPayload): Promise<CurrentUser> {
    const { data } = await request<AccessTokenResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      authenticated: false,
    })
    setAccessToken(data.access_token)
    return data.user
  },

  async logout(): Promise<void> {
    try {
      await http.post<null>('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },

  async changePassword(payload: ChangePasswordPayload): Promise<string> {
    const { message } = await http.post<null>('/auth/change-password', payload)
    setAccessToken(null)
    return message
  },

  async me(): Promise<CurrentUser> {
    const { data } = await http.get<CurrentUser>('/auth/me')
    return data
  },

  restore: refreshSession,
}
