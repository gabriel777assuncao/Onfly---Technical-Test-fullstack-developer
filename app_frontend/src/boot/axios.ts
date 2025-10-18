import { boot } from 'quasar/wrappers';
import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from 'src/stores/auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

type RetriableRequestConfig = InternalAxiosRequestConfig & { __retried?: boolean };

export default boot(({ router, store }): void => {
  const authStore = useAuthStore(store);

  api.interceptors.request.use((requestConfig: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = authStore.token;

    if (!accessToken) {
      return requestConfig;
    }

    requestConfig.headers = requestConfig.headers ?? {};
    (requestConfig.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;

    return requestConfig;
  });

  let isRefreshingToken = false;

  api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (axiosError: AxiosError): Promise<unknown> => {
      const statusCode = axiosError.response?.status;
      const originalRequest = axiosError.config as RetriableRequestConfig | undefined;

      if (statusCode !== 401 || !originalRequest || originalRequest.__retried) {
        if (statusCode === 401) {
          await authStore.logoutUser();
          await router.push('/login');
        }

        return Promise.reject(axiosError instanceof Error ? axiosError : new Error('Request failed'));
      }

      if (!isRefreshingToken) {
        isRefreshingToken = true;
        try {
          await authStore.refreshTokens();
          originalRequest.__retried = true;

          return api.request(originalRequest);
        } catch (refreshError) {
          await authStore.logoutUser();
          await router.push('/login');

          return Promise.reject(refreshError instanceof Error ? refreshError : new Error('Unauthorized'));
        } finally {
          isRefreshingToken = false;
        }
      }

      return Promise.reject(axiosError instanceof Error ? axiosError : new Error('Request failed'));
    }
  );
});
