import { type AxiosResponse } from "axios";

import type {
    ShareLink,
    ShareLinkListResponse,
    ShareRole,
    SharedNoteResponse,
} from "@/entities/share/types";
import { authRequest } from "@/shared/api/http";

class ShareProxy {
    private readonly BASE_URL = "/share";

    public createShareLink = async (
        noteKey: string,
        role: ShareRole,
    ): Promise<ShareLink> => {
        const response: AxiosResponse<ShareLink> = await authRequest<ShareLink>(
            {
                url: `${this.BASE_URL}/notes/${noteKey}`,
                method: "POST",
                params: { role },
            },
        );

        return response.data;
    };

    public getShareLinks = async (
        noteKey: string,
    ): Promise<ShareLinkListResponse> => {
        const response: AxiosResponse<ShareLinkListResponse> =
            await authRequest<ShareLinkListResponse>({
                url: `${this.BASE_URL}/notes/${noteKey}`,
                method: "GET",
            });

        return response.data;
    };

    public getSharedNote = async (
        shareKey: string,
    ): Promise<SharedNoteResponse> => {
        const response: AxiosResponse<SharedNoteResponse> =
            await authRequest<SharedNoteResponse>({
                url: `${this.BASE_URL}/${shareKey}`,
                method: "GET",
            });

        return response.data;
    };

    public deleteShareLink = async (shareKey: string): Promise<void> => {
        await authRequest<void>({
            url: `${this.BASE_URL}/${shareKey}`,
            method: "DELETE",
        });
    };
}

export const shareProxy = new ShareProxy();
