export type UserAuthResponse = {
    access_token: string
    refresh_token: string
}

export type UserListItem = {
    user_key: string
    username: string
    role: string
    notes_count: number
    created_at: string
}

export type GetUsersResponse = UserListItem[]

export type GetUserResponse = {
    user_key: string
    username: string
    role: string
    notes_count: number
    created_at: string
}
