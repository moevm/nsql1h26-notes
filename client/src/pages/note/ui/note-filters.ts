import type { GetNotesRequest } from "@/entities/note/types/requests";

export type NoteFilters = {
    user_key: string;
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
    user_key: "",
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

export function mergeNoteFilters(filters: Partial<NoteFilters>): NoteFilters {
    return {
        ...DEFAULT_NOTE_FILTERS,
        ...filters,
        user_key: filters.user_key ?? "",
        parent_key: filters.parent_key ?? "",
        linked_note_key: filters.linked_note_key ?? "",
        tag: filters.tag ?? "",
        search: filters.search ?? "",
        created_from: filters.created_from ?? "",
        updated_from: filters.updated_from ?? "",
        created_to: filters.created_to ?? "",
        updated_to: filters.updated_to ?? "",
        limit: filters.limit ?? DEFAULT_NOTE_FILTERS.limit,
        offset: filters.offset ?? DEFAULT_NOTE_FILTERS.offset,
    };
}

const toNullableString = (value: string | undefined) => {
    const trimmed = (value ?? "").trim();
    return trimmed ? trimmed : null;
};

const toNullableISOString = (value: string | undefined) => {
    const trimmed = (value ?? "").trim();

    if (!trimmed) {
        return null;
    }

    const date = new Date(trimmed);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
};

export function buildGetNotesRequest(
    filters: Partial<NoteFilters>,
): GetNotesRequest {
    const resolved = mergeNoteFilters(filters);

    return {
        user_key: toNullableString(resolved.user_key),
        parent_key: toNullableString(resolved.parent_key),
        linked_note_key: toNullableString(resolved.linked_note_key),
        tag: toNullableString(resolved.tag),
        search: toNullableString(resolved.search),
        created_from: toNullableISOString(resolved.created_from),
        updated_from: toNullableISOString(resolved.updated_from),
        created_to: toNullableISOString(resolved.created_to),
        updated_to: toNullableISOString(resolved.updated_to),
        limit: Math.max(1, resolved.limit),
        offset: Math.max(0, resolved.offset),
    };
}

export function countActiveNoteFilters(filters: Partial<NoteFilters>) {
    const resolved = mergeNoteFilters(filters);

    return [
        resolved.user_key,
        resolved.parent_key,
        resolved.linked_note_key,
        resolved.tag,
        resolved.search,
        resolved.created_from,
        resolved.updated_from,
        resolved.created_to,
        resolved.updated_to,
    ].filter((value) => value.trim()).length;
}
