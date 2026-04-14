export type GetNotesRequest = {
    parent_key?: string | null;
    tag?: string | null;
    search?: string | null;
    limit: number;
    offset: number;
};

export type CreateNoteRequest = {
    title: string;
    content: string;
    parent_key?: string | null;
    tags: string[];
};

export type UpdateNoteRequest = CreateNoteRequest;
