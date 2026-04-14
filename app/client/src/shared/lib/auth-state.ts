let accessToken: string | null = null;
let forbiddenRedirect: (() => void) | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setForbiddenRedirect(handler: (() => void) | null) {
  forbiddenRedirect = handler;
}

export function redirectOnForbidden() {
  forbiddenRedirect?.();
}
