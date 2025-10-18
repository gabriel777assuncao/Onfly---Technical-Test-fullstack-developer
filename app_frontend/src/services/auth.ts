import { api } from 'src/boot/axios'

export type User = {
  id: number,
  name: string,
  username: string,
  email: string,
  is_admin: boolean,
};

export type LoginPayload = {
  email: string,
  password: string,
};

export type RegisterPayload = {
  name: string,
  username: string,
  email: string,
  password: string,
  password_confirmation?: string,
};

export type JwtResponse = {
  token: string,
  token_type: 'Bearer',
  expires_in: number,
  expires_at: string,
}

export async function login(data: LoginPayload): Promise<JwtResponse> {
  const res = await api.post('/auth/login', data);

  return res.data as JwtResponse
}

export async function register(data: RegisterPayload): Promise<{ message: string; user: User }> {
  const res = await api.post('/auth/register', data);

  return res.data as { message: string; user: User };
}

export async function me(): Promise<User> {
  const res = await api.get('/auth/me');

  return (res.data?.user ?? null) as User;
}

export async function logout(): Promise<{ message: string }> {
  const res = await api.post('/auth/logout');

  return res.data as { message: string };
}

export async function refresh(): Promise<JwtResponse> {
  const res = await api.post('/auth/refresh');

  return res.data as JwtResponse;
}
