import type {GetUsersResponse} from "@/entities/user/types/responses";
import type {AxiosResponse} from "axios";
import {http} from "@/shared/api/http";

class UsersProxy {
    private readonly BASE_URL = "/users";

    public getUsers = async (
        token: string,
    ): Promise<GetUsersResponse | null> => {
        try {
            const response: AxiosResponse<GetUsersResponse> =
                await http.get<GetUsersResponse>(
                    `${this.BASE_URL}`,
                    {
                        headers: {
                            Authorization: token.startsWith("Bearer ")
                                ? token
                                : `Bearer ${token}`,
                        },
                    },
                );
            console.log(response.data);
            return response.data;
        } catch (e) {
            throw e;
        }
    };
}

export const usersProxy = new UsersProxy()