import { type AxiosResponse } from "axios";

import { authRequest } from "@/shared/api/http";

class BackupProxy {
    private readonly BASE_URL = "/backup";

    public exportBackup = async (): Promise<AxiosResponse<Blob>> => {
        return authRequest<Blob>({
            url: `${this.BASE_URL}/export`,
            method: "GET",
            responseType: "blob",
        });
    };

    public importBackup = async (file: File): Promise<void> => {
        const data = new FormData();
        data.append("file", file);

        await authRequest<void>({
            url: `${this.BASE_URL}/import`,
            method: "POST",
            data,
        });
    };
}

export const backupProxy = new BackupProxy();
