import axios, { AxiosHeaders, type AxiosRequestConfig } from "axios";

import { API_BASE_URL } from "@/shared/config/api";
import { getAccessToken, redirectOnForbidden } from "@/shared/lib/auth-state";

export const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers = AxiosHeaders.from({
      ...(config.headers as Record<string, unknown> | undefined),
      Authorization: `${token}`,
    });
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 403) {
      redirectOnForbidden();
    }

    return Promise.reject(error);
  }
);

export function requestWithToken<T>(config: AxiosRequestConfig, token?: string | null) {
  const headers = AxiosHeaders.from(config.headers as any);

  if (token) {
    headers.set("Authorization", `${token}`);
  }

  return http.request<T>({
    ...config,
    headers,
  });
}
