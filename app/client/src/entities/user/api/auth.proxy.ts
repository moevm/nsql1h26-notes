import axios, { type AxiosResponse } from "axios";

import type { LoginRequest, RegisterRequest } from "@/entities/user/types/requests";
import type { UserAuthResponse } from "@/entities/user/types/responses";
import { http, requestWithToken } from "@/shared/api/http";

class AuthProxy {

    private readonly BASE_URL = "/auth"

    public register = async  (user: RegisterRequest): Promise<UserAuthResponse | null>  => {
        try {
            const response: AxiosResponse<UserAuthResponse> = await http.post(`${this.BASE_URL}/register`, user)
            return response.data
        } catch (e) {
            throw e
        }
    }

    public login = async  (user: LoginRequest): Promise<UserAuthResponse | null>  => {
        try {
            const response: AxiosResponse<UserAuthResponse> = await http.post(`${this.BASE_URL}/login`, user)
            return response.data
        } catch (e) {
            throw e
        }
    }

    public refresh = async  (token: string): Promise<UserAuthResponse | null>  => {
        try {
            const response: AxiosResponse<UserAuthResponse> = await requestWithToken<UserAuthResponse>(
                {
                    url: `${this.BASE_URL}/refresh`,
                    method: "POST",
                },
                token
            )
            return response.data
        } catch (e) {
            throw e
        }
    }

}

export const authProxy = new AuthProxy();
