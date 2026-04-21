export type Note = {
    title: string,
    content: string
    parent_key: string | null
    tags: string[]
    note_key: string
    user_ref: string
    username: string
    created_at: string
    updated_at: string
}