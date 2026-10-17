export interface CurrentUser {
  id: number
  full_name: string
  email: string
  roles: string[]
  permissions: string[]
}

export interface AccessTokenResponse {
  access_token: string
  token_type: string
  expires_at: string
  user: CurrentUser
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}
