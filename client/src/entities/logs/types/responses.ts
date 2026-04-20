import type {
    LogType,
    NoteAction,
    PermissionAction,
    RegistrationAction,
} from "@/entities/logs/types/base";

export type NoteState = {
    title: string;
    content: string;
    parent_key: string | null;
    tags: string[];
};

type LogBase = {
    log_key: string;
    type: NonNullable<LogType>;
    created_at: string;
};

export type RegistrationLog = LogBase & {
    type: "registration";
    action: NonNullable<RegistrationAction>;
    user_key: string;
};

export type NoteLog = LogBase & {
    type: "note";
    action: NonNullable<NoteAction>;
    note_key: string;
    state_before: NoteState;
    state_after: NoteState;
    diff: string;
    user_key: string;
};

export type PermissionLog = LogBase & {
    type: "permission";
    action: NonNullable<PermissionAction>;
    note_key: string;
    before_permission_type: string;
    after_permission_type: string;
    granted_by_key: string;
    granted_to_key: string;
};

export type Log = RegistrationLog | NoteLog | PermissionLog;

export type GetLogsResponse = Log[];

export type GetLogsRespones = GetLogsResponse;
