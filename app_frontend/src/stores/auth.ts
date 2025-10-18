// src/stores/auth.ts
import { defineStore } from 'pinia';
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
  refresh as refreshApi,
  register as registerApi,
  type User,
  type RegisterPayload,
} from 'src/services/auth';
import { mapHttpToDomainError } from 'src/domain/errors';

type AuthTokens = { token: string; expires_at: string | null; };
type AuthState = { user: User | null; token: string | null; expiresAt: string | null; };

const TOKEN_KEY = 'token';
const EXPIRES_AT_KEY = 'expires_at';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    expiresAt: localStorage.getItem(EXPIRES_AT_KEY),
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
    isAdmin: (s) => !!s.user?.is_admin,
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
      if (expiresAt) localStorage.setItem(EXPIRES_AT_KEY, expiresAt);
      else localStorage.removeItem(EXPIRES_AT_KEY);
    },

    async registerAccount(payload: RegisterPayload): Promise<void> {
      try {
        await registerApi(payload);
        await this.loginWithCredentials({ email: payload.email, password: payload.password });
      } catch (error) {
        throw mapHttpToDomainError(error);
      }
    },

    async loginWithCredentials(payload: { email: string; password: string }): Promise<void> {
      try {
        const t: AuthTokens = await loginApi(payload);
        this.applyTokens(t.token, t.expires_at);
        this.user = await meApi();
      } catch (error) {
        this.applyTokens(null);
        throw mapHttpToDomainError(error);
      }
    },

    async logoutUser(): Promise<void> {
      try { await logoutApi(); } catch (e) { console.debug('logout ignored', e); }
      this.user = null;
      this.applyTokens(null);
    },

    async refreshTokens(): Promise<void> {
      try {
        const t: AuthTokens = await refreshApi();
        this.applyTokens(t.token, t.expires_at);
      } catch (error) {
        this.user = null;
        this.applyTokens(null);
        throw mapHttpToDomainError(error);
      }
    },

    async loadExistingSession(): Promise<void> {
      if (!this.token) return;
      try { this.user = await meApi(); }
      catch { await this.logoutUser(); }
    },
  },
});
