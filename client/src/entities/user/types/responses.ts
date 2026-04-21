export type UserAuthResponse = {
    access_token: string
    refresh_token: string
}

export type GetUsersResponse = {
    user_key: string
    username: string
    role: string
}[]