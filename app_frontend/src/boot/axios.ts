import { boot } from 'quasar/wrappers';
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { useAuthStore } from 'src/stores/auth';
import { Loading, QSpinnerGears } from 'quasar';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  __retried?: boolean;
  __showLoading?: boolean;
};

let activeRequests = 0;
let showTimer: number | undefined;

function shouldTrackLoading(config?: InternalAxiosRequestConfig | null): boolean {
  if (!config) return false;
  const cfg = config as RetriableRequestConfig;
  if (cfg.__showLoading === false) return false;
  const url = String(cfg.url || '');
  if (url.includes('/auth/refresh')) return false;
  return true;
}

function startLoading(config?: InternalAxiosRequestConfig | null): void {
  if (!shouldTrackLoading(config)) return;

  activeRequests += 1;

  if (activeRequests === 1) {
    showTimer = window.setTimeout(() => {
      Loading.show({ spinner: QSpinnerGears });
    }, 150);
  }
}

function stopLoading(config?: InternalAxiosRequestConfig | null): void {
  if (!shouldTrackLoading(config)) return;

  activeRequests = Math.max(0, activeRequests - 1);

  if (activeRequests === 0) {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }
    Loading.hide();
  }
}

export default boot(({ router, store }): void => {
  const authStore = useAuthStore(store);

  async function handleUnauthorized(): Promise<void> {
    await authStore.logoutUser();
    if (router.currentRoute.value.path !== '/login') {
      await router.push('/login');
    }
  }

  api.interceptors.request.use((requestConfig: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    startLoading(requestConfig);

    const accessToken = authStore.token;
    if (accessToken) {
      requestConfig.headers = requestConfig.headers ?? {};
      (requestConfig.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
    }

    return requestConfig;
  });

  let isRefreshingToken = false;

  // 1) Handler de 401/refresh (não mexe no loading aqui)
  api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (axiosError: AxiosError): Promise<unknown> => {
      const statusCode = axiosError.response?.status;
      const originalRequest = axiosError.config as RetriableRequestConfig | undefined;

      if (statusCode !== 401) {
        return Promise.reject(axiosError instanceof Error ? axiosError : new Error('Request failed'));
      }

      if (!originalRequest || originalRequest.__retried) {
        await handleUnauthorized();
        return Promise.reject(axiosError instanceof Error ? axiosError : new Error('Unauthorized'));
      }

      if (!isRefreshingToken) {
        isRefreshingToken = true;

        try {
          await authStore.refreshTokens();
          originalRequest.__retried = true;
          return api.request(originalRequest);
        } catch (refreshError) {
          await handleUnauthorized();
          return Promise.reject(refreshError instanceof Error ? refreshError : new Error('Unauthorized'));
        } finally {
          isRefreshingToken = false;
        }
      }

      return Promise.reject(axiosError instanceof Error ? axiosError : new Error('Request failed'));
    }
  );

  api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      stopLoading(response.config);
      return response;
    },
    (error: AxiosError): Promise<never> => {
      stopLoading(error.config);
      return Promise.reject(error);
    }
  );
});
