import { defineStore } from 'pinia';
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
  refresh as refreshApi,
  register as registerApi,
} from 'src/services/auth';
import { mapHttpToDomainError } from 'src/domain/errors';
import type { IUser, IAuthTokens, IRegisterPayload, ILoginPayload } from 'src/types/auth.types';

interface IAuthState {
  user: IUser | null;
  token: string | null;
  expiresAt: string | null;
}

const TOKEN_KEY = 'token';
const EXPIRES_AT_KEY = 'expires_at';

export const useAuthStore = defineStore('auth', {
  state: (): IAuthState => ({
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    expiresAt: localStorage.getItem(EXPIRES_AT_KEY),
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    isAdmin: (state): boolean => !!state.user?.is_admin,
  },

  actions: {
    applyTokens(token: string | null, expiresAt?: string | null): void {
      this.token = token;
      this.expiresAt = expiresAt ?? null;

      if (!token) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRES_AT_KEY);
        return;
      }

      localStorage.setItem(TOKEN_KEY, token);

      if (expiresAt) {
        localStorage.setItem(EXPIRES_AT_KEY, expiresAt);
      } else {
        localStorage.removeItem(EXPIRES_AT_KEY);
      }
    },

    async registerAccount(payload: IRegisterPayload): Promise<void> {
      try {
        await registerApi(payload);
        await this.loginWithCredentials({
          email: payload.email,
          password: payload.password,
        });
      } catch (error: unknown) {
        throw mapHttpToDomainError(error);
      }
    },

    async loginWithCredentials(payload: ILoginPayload): Promise<void> {
      try {
        const { token, expires_at }: IAuthTokens = await loginApi(payload);
        this.applyTokens(token, expires_at);
        this.user = await meApi();
      } catch (error: unknown) {
        this.applyTokens(null);
        throw mapHttpToDomainError(error);
      }
    },

    async logoutUser(): Promise<void> {
      try {
        await logoutApi();
      } finally {
        this.user = null;
        this.applyTokens(null);
      }
    },

    async refreshTokens(): Promise<void> {
      try {
        const { token, expires_at }: IAuthTokens = await refreshApi();
        this.applyTokens(token, expires_at);
      } catch (error: unknown) {
        this.user = null;
        this.applyTokens(null);
        throw mapHttpToDomainError(error);
      }
    },

    async fetchUser(): Promise<void> {
      try {
        this.user = await meApi();
      } catch (error: unknown) {
        this.user = null;
        this.applyTokens(null);
        throw mapHttpToDomainError(error);
      }
    },
  },
});
