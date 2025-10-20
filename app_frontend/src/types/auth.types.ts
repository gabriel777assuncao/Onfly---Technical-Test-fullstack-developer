export interface IUser {
  id: number;
  name: string;
  username: string;
  email: string;
  is_admin: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface IAuthTokens {
  token: string;
  expires_at: string | null;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation?: string;
}

export interface IJwtResponse {
  token: string;
  token_type: 'Bearer';
  expires_in: number;
  expires_at: string;
}
