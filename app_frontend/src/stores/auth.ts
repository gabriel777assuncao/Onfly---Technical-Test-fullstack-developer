import { defineStore } from 'pinia'
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
  refresh as refreshApi,
  register as registerApi,
  type User,
  type RegisterPayload,
} from 'src/services/auth'
import { mapHttpToDomainError } from 'src/domain/errors'

type AuthTokens = {
  token: string
  expires_at: string | null
}

type AuthState = {
  user: User | null
  token: string | null
  expiresAt: string | null
}

const TOKEN_KEY = 'token'
const EXPIRES_AT_KEY = 'expires_at'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    expiresAt: localStorage.getItem(EXPIRES_AT_KEY),
  }),

  getters: {
    isAuthenticated: (s): boolean => !!s.token,
    isAdmin: (s): boolean => !!s.user?.is_admin,
  },

  actions: {
    applyTokens(token: string | null, expiresAt?: string | null): void {
      this.token = token
      this.expiresAt = expiresAt ?? null

      if (!token) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(EXPIRES_AT_KEY)
        return
      }

      if (expiresAt) {
        localStorage.setItem(EXPIRES_AT_KEY, expiresAt)
      } else {
        localStorage.removeItem(EXPIRES_AT_KEY)
      }
    },

    async registerAccount(payload: RegisterPayload): Promise<void> {
      try {
        await registerApi(payload)
        await this.loginWithCredentials({
          email: payload.email,
          password: payload.password,
        })
      } catch (error: unknown) {
        throw mapHttpToDomainError(error)
      }
    },

    async loginWithCredentials(payload: { email: string; password: string }): Promise<void> {
      try {
        const { token, expires_at }: AuthTokens = await loginApi(payload)
        this.applyTokens(token, expires_at)
        this.user = await meApi()
      } catch (error: unknown) {
        this.applyTokens(null)
        throw mapHttpToDomainError(error)
      }
    },

    async logoutUser(): Promise<void> {
      try {
        await logoutApi()
      } catch (error) {
        console.debug('logout ignored', error)
      } finally {
        this.user = null
        this.applyTokens(null)
      }
    },

    async refreshTokens(): Promise<void> {
      try {
        const { token, expires_at }: AuthTokens = await refreshApi()
        this.applyTokens(token, expires_at)
      } catch (error: unknown) {
        this.user = null
        this.applyTokens(null)
        throw mapHttpToDomainError(error)
      }
    },
  },
})
