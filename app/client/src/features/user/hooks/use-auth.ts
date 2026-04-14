import { useState } from "react";

import { authProxy } from "@/entities/user/api/auth.proxy";
import type { LoginRequest, RegisterRequest } from "@/entities/user/types/requests";
import { getErrorMessage } from "@/shared/api/error";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "@/shared/lib/token-storage";
import { setAccessToken } from "@/shared/lib/auth-state";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(payload: LoginRequest) {
    setLoading(true);
    setError(null);

    try {
      const response = await authProxy.login(payload);
      if (!response) return null;
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      return response;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload: RegisterRequest) {
    setLoading(true);
    setError(null);

    try {
      const response = await authProxy.register(payload);
      if (!response) return null;
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      return response;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await authProxy.refresh(refreshToken);
      if (!response) {
        clearRefreshToken();
        setAccessToken(null);
        return null;
      }
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      return response;
    } catch (err) {
      clearRefreshToken();
      setAccessToken(null);
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { login, register, refresh, loading, error };
}
