import { ISOString } from "@/shared/types/date";

export type GetNotesRequest = {
    user_key?: string | null;
    parent_key?: string | null;
    linked_note_key?: string | null;
    tag?: string | null;
    search?: string | null;
    created_from?: ISOString | null;
    updated_from?: ISOString | null;
    created_to?: ISOString | null;
    updated_to?: ISOString | null;
    limit: number;
    offset: number;
};

export type CreateNoteRequest = {
    title: string;
    content: string;
    parent_key?: string | null;
    tags: string[];
    linked_note_keys: string[];
};

export type UpdateNoteRequest = CreateNoteRequest;
