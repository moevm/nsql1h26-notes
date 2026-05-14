import type { Note } from "@/entities/note/types/dto";

export type ShareRole = "read" | "write";

export type ShareLink = {
    share_key: string;
    role: ShareRole;
    enabled: boolean;
    created_at: string;
};

export type ShareLinkListResponse = {
    links: ShareLink[];
};

export type SharedNoteResponse = Note & {
    access_role: ShareRole;
};
