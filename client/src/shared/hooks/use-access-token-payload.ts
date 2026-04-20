import { useMemo, useSyncExternalStore } from "react";

import { decodeAccessTokenPayload } from "@/shared/lib/access-token-payload";
import { getAccessToken, subscribeAccessToken } from "@/shared/lib/auth-state";

export function useAccessTokenPayload() {
    const accessToken = useSyncExternalStore(
        subscribeAccessToken,
        getAccessToken,
        getAccessToken,
    );

    return useMemo(() => decodeAccessTokenPayload(accessToken), [accessToken]);
}
