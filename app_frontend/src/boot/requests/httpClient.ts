import { boot } from "quasar/wrappers";
import { Loading, QSpinnerGears } from "quasar";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { httpClient } from "src/api/httpClient";
import { useAuthStore } from "stores/auth";

type RetriableRequestConfiguration = InternalAxiosRequestConfig & {
  __requestAlreadyRetried?: boolean,
  __displayGlobalLoading?: boolean,
};

let activeRequestCount = 0;
let displayLoadingTimerIdentifier: number | undefined;
let isAuthenticationTokenRefreshing = false;
let authenticationRefreshWaitQueue: Array<() => void> = [];

function shouldDisplayGlobalLoading(inputConfiguration?: InternalAxiosRequestConfig | null): boolean {
  if (!inputConfiguration) {
    return false;
  }
  const requestConfiguration = inputConfiguration as RetriableRequestConfiguration;
  if (requestConfiguration.__displayGlobalLoading === false) {
    return false;
  }
  const requestUrlText = String(requestConfiguration.url || "");
  if (requestUrlText.includes("/auth/refresh")) {
    return false;
  }
  return true;
}

function startGlobalLoading(inputConfiguration?: InternalAxiosRequestConfig | null): void {
  if (!shouldDisplayGlobalLoading(inputConfiguration)) {
    return;
  }
  activeRequestCount += 1;
  if (activeRequestCount === 1) {
    displayLoadingTimerIdentifier = window.setTimeout(() => {
      Loading.show({ spinner: QSpinnerGears });
    }, 150);
  }
}

function stopGlobalLoading(inputConfiguration?: InternalAxiosRequestConfig | null): void {
  if (!shouldDisplayGlobalLoading(inputConfiguration)) {
    return;
  }
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  if (activeRequestCount === 0) {
    if (displayLoadingTimerIdentifier) {
      clearTimeout(displayLoadingTimerIdentifier);
      displayLoadingTimerIdentifier = undefined;
    }
    Loading.hide();
  }
}

export default boot(({ router, store }): void => {
  const authenticationStore = useAuthStore(store);

  async function handleUnauthorizedRedirection(): Promise<void> {
    await authenticationStore.logoutUser();
    if (router.currentRoute.value.path !== "/login") {
      await router.push("/login");
    }
  }

  function attachAuthorizationHeader(requestConfiguration: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const accessTokenText = authenticationStore.token;
    if (accessTokenText) {
      requestConfiguration.headers = requestConfiguration.headers ?? {};
      (requestConfiguration.headers as Record<string, string>).Authorization = `Bearer ${accessTokenText}`;
    }

    return requestConfiguration;
  }

  function enqueueAuthenticationRefreshResolution(): Promise<void> {
    return new Promise((resolve) => {
      authenticationRefreshWaitQueue.push(resolve);
    });
  }

  function resolveAuthenticationRefreshQueue(): void {
    authenticationRefreshWaitQueue.forEach((resolve) => resolve());
    authenticationRefreshWaitQueue = [];
  }

  httpClient.interceptors.request.use((requestConfiguration: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    startGlobalLoading(requestConfiguration);

    return attachAuthorizationHeader(requestConfiguration);
  });

  httpClient.interceptors.response.use(
    (successfulResponse: AxiosResponse): AxiosResponse => {
      stopGlobalLoading(successfulResponse.config);
      return successfulResponse;
    },
    async (failingError: AxiosError): Promise<unknown> => {
      stopGlobalLoading(failingError.config);

      const responseStatusCode = failingError.response?.status;
      const originalRequestConfiguration = failingError.config as RetriableRequestConfiguration | undefined;

      if (responseStatusCode !== 401) {
        return Promise.reject(failingError instanceof Error ? failingError : new Error("Request failed"));
      }

      if (!originalRequestConfiguration) {
        await handleUnauthorizedRedirection();

        return Promise.reject(failingError instanceof Error ? failingError : new Error("Unauthorized"));
      }

      if (originalRequestConfiguration.__requestAlreadyRetried) {
        await handleUnauthorizedRedirection();

        return Promise.reject(failingError instanceof Error ? failingError : new Error("Unauthorized"));
      }

      if (isAuthenticationTokenRefreshing) {
        await enqueueAuthenticationRefreshResolution();
        originalRequestConfiguration.__requestAlreadyRetried = true;

        return httpClient.request(originalRequestConfiguration);
      }

      isAuthenticationTokenRefreshing = true;

      try {
        await authenticationStore.refreshTokens();
        resolveAuthenticationRefreshQueue();
        originalRequestConfiguration.__requestAlreadyRetried = true;

        return httpClient.request(originalRequestConfiguration);
      } catch (authenticationRefreshError) {
        await handleUnauthorizedRedirection();
        return Promise.reject(authenticationRefreshError instanceof Error ? authenticationRefreshError : new Error("Unauthorized"));
      } finally {
        isAuthenticationTokenRefreshing = false;
      }
    }
  );
});

export { httpClient as api };
