import { useCallback, useState } from "react";

import { logsProxy } from "@/entities/logs/api/proxy";
import type { GetLogsQueryParams } from "@/entities/logs/types/requests";
import type { GetLogsResponse } from "@/entities/logs/types/responses";
import { getErrorMessage } from "@/shared/api/error";

export function useGetLogs() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getLogs = useCallback(async (payload: GetLogsQueryParams): Promise<GetLogsResponse | null> => {
        setLoading(true);
        setError(null);

        try {
            return await logsProxy.getLogs(payload);
        } catch (err) {
            setError(getErrorMessage(err));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { getLogs, loading, error };
}
