import type { GetNotesRequest } from "@/entities/note/types/requests";

export type NoteFilters = {
    parent_key: string;
    linked_note_key: string;
    tag: string;
    search: string;
    created_from: string;
    updated_from: string;
    created_to: string;
    updated_to: string;
    limit: number;
    offset: number;
};

export const DEFAULT_NOTE_FILTERS: NoteFilters = {
    parent_key: "",
    linked_note_key: "",
    tag: "",
    search: "",
    created_from: "",
    updated_from: "",
    created_to: "",
    updated_to: "",
    limit: 256,
    offset: 0,
};

const toNullableString = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
};

const toNullableISOString = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const date = new Date(trimmed);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
};

export function buildGetNotesRequest(filters: NoteFilters): GetNotesRequest {
    return {
        parent_key: toNullableString(filters.parent_key),
        linked_note_key: toNullableString(filters.linked_note_key),
        tag: toNullableString(filters.tag),
        search: toNullableString(filters.search),
        created_from: toNullableISOString(filters.created_from),
        updated_from: toNullableISOString(filters.updated_from),
        created_to: toNullableISOString(filters.created_to),
        updated_to: toNullableISOString(filters.updated_to),
        limit: Math.max(1, filters.limit),
        offset: Math.max(0, filters.offset),
    };
}

export function countActiveNoteFilters(
    filters: NoteFilters,
    defaults: NoteFilters = DEFAULT_NOTE_FILTERS,
) {
    const textFilters = [
        filters.parent_key,
        filters.linked_note_key,
        filters.tag,
        filters.search,
        filters.created_from,
        filters.updated_from,
        filters.created_to,
        filters.updated_to,
    ].filter((value) => value.trim()).length;

    const pagingFilters =
        filters.limit !== defaults.limit || filters.offset !== defaults.offset
            ? 1
            : 0;

    return textFilters + pagingFilters;
}
