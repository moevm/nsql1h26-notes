import { type AxiosResponse } from "axios";

import type { GetLogsQueryParams } from "@/entities/logs/types/requests";
import type { GetLogsResponse } from "@/entities/logs/types/responses";
import { authRequest } from "@/shared/api/http";

function cleanParams(params: GetLogsQueryParams): GetLogsQueryParams {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== ""),
    ) as GetLogsQueryParams;
}

class LogsProxy {
    private readonly BASE_URL = "/logs";

    public getLogs = async (
        params: GetLogsQueryParams,
    ): Promise<GetLogsResponse> => {
        try {
            const response: AxiosResponse<GetLogsResponse> =
                await authRequest<GetLogsResponse>({
                    url: this.BASE_URL,
                    method: "GET",
                    params: cleanParams(params),
                });
            return response.data;
        } catch (e) {
            console.log("[ERROR] while getting logs", e);
            return [];
        }
    };
}

export const logsProxy = new LogsProxy();
