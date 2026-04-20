import { ISOString } from "@/shared/types/date";

export type GetNotesRequest = {
    parent_key?: string | null;
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
};

export type UpdateNoteRequest = CreateNoteRequest;
