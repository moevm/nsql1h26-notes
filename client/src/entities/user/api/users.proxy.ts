import type {
    GetUserResponse,
    GetUsersResponse,
} from "@/entities/user/types/responses";
import type { AxiosResponse } from "axios";
import { authRequest, http } from "@/shared/api/http";

class UsersProxy {
    private readonly BASE_URL = "/users";

    public getUsers = async (
        params?: {
            search?: string;
            role?: string;
            sort_by?: string;
            sort_order?: string;
        },
    ): Promise<GetUsersResponse | null> => {
        try {
            const config: { params?: Record<string, string> } = {};

            if (params) {
                config.params = {
                    ...(params.search ? { search: params.search } : {}),
                    ...(params.role ? { role: params.role } : {}),
                    ...(params.sort_by ? { sort_by: params.sort_by } : {}),
                    ...(params.sort_order ? { sort_order: params.sort_order } : {}),
                };
            }

            const response: AxiosResponse<GetUsersResponse> = await http.get<
                GetUsersResponse
            >(`${this.BASE_URL}`, Object.keys(config).length ? config : undefined);
            return response.data;
        } catch (e) {
            throw e;
        }
    };

    public getUsersAuth = async (token: string): Promise<GetUsersResponse | null> => {
        try {
            const config = {
                headers: {
                    Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
                },
            } as const;

            const response: AxiosResponse<GetUsersResponse> = await http.get<
                GetUsersResponse
            >(`${this.BASE_URL}`, config);

            return response.data;
        } catch (e) {
            throw e;
        }
    };

    public getUser = async (userKey: string): Promise<GetUserResponse> => {
        const response: AxiosResponse<GetUserResponse> =
            await authRequest<GetUserResponse>({
                url: `${this.BASE_URL}/${userKey}`,
                method: "GET",
            });

        return response.data;
    };
}

export const usersProxy = new UsersProxy();
