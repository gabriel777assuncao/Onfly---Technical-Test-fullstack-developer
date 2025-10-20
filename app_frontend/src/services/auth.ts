import { api } from 'boot/requests/httpClient';
import type {
  IUser,
  ILoginPayload,
  IRegisterPayload,
  IJwtResponse,
} from 'src/types/auth.types';

export async function login(data: ILoginPayload): Promise<IJwtResponse> {
  const res = await api.post('/auth/login', data);
  return res.data as IJwtResponse;
}

export async function register(
  data: IRegisterPayload,
): Promise<{ message: string; user: IUser }> {
  const res = await api.post('/auth/register', data);
  return res.data as { message: string; user: IUser };
}

export async function me(): Promise<IUser> {
  const res = await api.get('/auth/me');
  const raw = (res.data?.user ?? null) as IUser | null;

  if (!raw) {
    return null as unknown as IUser;
  }

  return {
    ...raw,
    is_admin: Boolean(
      typeof raw.is_admin === 'string'
        ? Number(raw.is_admin)
        : raw.is_admin,
    ),
  };
}

export async function logout(): Promise<{ message: string }> {
  const res = await api.post('/auth/logout');
  return res.data as { message: string };
}

export async function refresh(): Promise<IJwtResponse> {
  const res = await api.post('/auth/refresh');
  return res.data as IJwtResponse;
}
