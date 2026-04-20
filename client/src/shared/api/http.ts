import axios, {
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

import type { UserAuthResponse } from "@/entities/user/types/responses";
import { API_BASE_URL } from "@/shared/config/api";
import { getAccessToken, redirectOnForbidden, setAccessToken } from "@/shared/lib/auth-state";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "@/shared/lib/token-storage";

export const http = axios.create({
  baseURL: API_BASE_URL,
});

const refreshHttp = axios.create({
  baseURL: API_BASE_URL,
});

type AuthConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

function toBearerToken(token: string) {
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

function isAuthEndpoint(url?: string) {
  return url?.startsWith("/auth/") ?? false;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    setAccessToken(null);
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshHttp
      .post<UserAuthResponse>("/auth/refresh", undefined, {
        headers: AxiosHeaders.from({
          Authorization: toBearerToken(refreshToken),
        }),
      })
      .then((response: AxiosResponse<UserAuthResponse>) => {
        setAccessToken(response.data.access_token);
        setRefreshToken(response.data.refresh_token);
        return response.data.access_token;
      })
      .catch(() => {
        clearRefreshToken();
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

http.interceptors.request.use(async (config) => {
  if (isAuthEndpoint(config.url)) {
    return config;
  }

  let token = getAccessToken();

  if (!token) {
    token = await refreshAccessToken();
  }

  if (token) {
    config.headers = AxiosHeaders.from({
      ...(config.headers as Record<string, unknown> | undefined),
      Authorization: toBearerToken(token),
    });
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error?.config as AuthConfig | undefined;
    const status = error?.response?.status;

    if (!originalConfig || isAuthEndpoint(originalConfig.url) || originalConfig._retry) {
      if (status === 403 && !isAuthEndpoint(originalConfig?.url)) {
        redirectOnForbidden();
      }

      return Promise.reject(error);
    }

    if (status === 401 || status === 403) {
      originalConfig._retry = true;

      const token = await refreshAccessToken();

      if (token) {
        originalConfig.headers = AxiosHeaders.from({
          ...(originalConfig.headers as Record<string, unknown> | undefined),
          Authorization: toBearerToken(token),
        });

        return http.request(originalConfig);
      }

      redirectOnForbidden();
    }

    return Promise.reject(error);
  }
);

export function authRequest<T>(config: AxiosRequestConfig) {
  return http.request<T>(config);
}
