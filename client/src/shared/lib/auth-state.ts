import {
    clearStoredAccessToken,
    getStoredAccessToken,
    setStoredAccessToken,
} from "@/shared/lib/token-storage";

let accessToken: string | null = getStoredAccessToken();
let forbiddenRedirect: (() => void) | null = null;
const accessTokenListeners = new Set<() => void>();

export function getAccessToken() {
    return accessToken;
}

export function setAccessToken(token: string | null) {
    accessToken = token;
    if (token) {
        setStoredAccessToken(token);
    } else {
        clearStoredAccessToken();
    }
    accessTokenListeners.forEach((listener) => listener());
}

export function subscribeAccessToken(listener: () => void) {
    accessTokenListeners.add(listener);
    return () => {
        accessTokenListeners.delete(listener);
    };
}

export function setForbiddenRedirect(handler: (() => void) | null) {
    forbiddenRedirect = handler;
}

export function redirectOnForbidden() {
    forbiddenRedirect?.();
}
