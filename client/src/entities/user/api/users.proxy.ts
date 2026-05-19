import type {
    GetUserResponse,
    GetUsersResponse,
} from "@/entities/user/types/responses";
import type { AxiosResponse } from "axios";
import { authRequest, http } from "@/shared/api/http";

class UsersProxy {
    private readonly BASE_URL = "/users";

    public getUsers = async (
        token?: string,
    ): Promise<GetUsersResponse | null> => {
        try {
            const response: AxiosResponse<GetUsersResponse> =
                await http.get<GetUsersResponse>(
                    `${this.BASE_URL}`,
                    token
                        ? {
                              headers: {
                                  Authorization: token.startsWith("Bearer ")
                                      ? token
                                      : `Bearer ${token}`,
                              },
                          }
                        : undefined,
                );
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
