export type AccessTokenPayload = {
    sub: string;
    role?: string;
    username?: string;
    type?: string;
    exp?: number;
};

function decodeBase64Url(value: string) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder().decode(bytes);
}

export function decodeAccessTokenPayload(token: string | null): AccessTokenPayload | null {
    if (!token) {
        return null;
    }

    try {
        const payload = JSON.parse(decodeBase64Url(token.split(".")[1])) as Partial<AccessTokenPayload>;

        if (typeof payload.sub !== "string") {
            return null;
        }

        return {
            sub: payload.sub,
            role: typeof payload.role === "string" ? payload.role : undefined,
            username: typeof payload.username === "string" ? payload.username : undefined,
            type: typeof payload.type === "string" ? payload.type : undefined,
            exp: typeof payload.exp === "number" ? payload.exp : undefined,
        };
    } catch {
        return null;
    }
}

export function isAdminRole(role?: string | null) {
    return role?.toLowerCase() === "admin";
}
