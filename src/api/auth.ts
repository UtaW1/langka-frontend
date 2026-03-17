import apiClient from './client'
import type {
  AuthSessionResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  User,
} from '@/types'

function normalizeUser(raw: any): User {
  return {
    id: String(raw.id),
    phone_number: raw.phone_number || raw.phone,
    name: raw.name,
    role: raw.role,
    createdAt: raw.inserted_at || raw.createdAt,
  }
}

export const authApi = {
  signUp: (data: RegisterRequest) =>
    apiClient.post<AuthSessionResponse>('/auth/register', data).then((r) => r.data),

  logIn: (data: LoginRequest) =>
    apiClient.post<AuthSessionResponse>('/auth/login', data).then((r) => r.data),

  refresh: (data: RefreshRequest) =>
    apiClient.post<{ access_token: string }>('/auth/refresh', data).then((r) => r.data),

  me: () =>
    apiClient.get<any>('/auth/me').then((r) => normalizeUser(r.data)),

  logout: () =>
    apiClient.post('/auth/logout').then((r) => r.data),
}
