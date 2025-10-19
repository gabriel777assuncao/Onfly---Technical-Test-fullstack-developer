import { api } from 'src/boot/axios'

export interface IUser {
  id: number
  name: string
  username: string
  email: string
  is_admin: boolean
}

export interface ILoginPayload {
  email: string
  password: string
}

export interface IRegisterPayload {
  name: string
  username: string
  email: string
  password: string
  password_confirmation?: string
}

export interface IJwtResponse {
  token: string
  token_type: 'Bearer'
  expires_in: number
  expires_at: string
}

export async function login(data: ILoginPayload): Promise<IJwtResponse> {
  const res = await api.post('/auth/login', data)
  return res.data as IJwtResponse
}

export async function register(data: IRegisterPayload): Promise<{ message: string; user: IUser }> {
  const res = await api.post('/auth/register', data)
  return res.data as { message: string; user: IUser }
}

export async function me(): Promise<IUser> {
  const res = await api.get('/auth/me')
  return (res.data?.user ?? null) as IUser
}

export async function logout(): Promise<{ message: string }> {
  const res = await api.post('/auth/logout')
  return res.data as { message: string }
}

export async function refresh(): Promise<IJwtResponse> {
  const res = await api.post('/auth/refresh')
  return res.data as IJwtResponse
}
