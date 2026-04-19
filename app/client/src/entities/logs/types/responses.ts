export type NoteState = {
    title: string;
    content: string;
    parent_key: string | null;
    tags: string[];
};

export type Log = {
    log_key: string;
    type: string;
    created_at: string;
    action: string;
    note_key: string;
    state_before: NoteState;
    state_after: NoteState;
    diff: "";
    user_key: string;
};

export type GetLogsRespones = Log[];
