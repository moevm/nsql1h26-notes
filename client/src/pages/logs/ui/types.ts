import type { LogType } from "@/entities/logs/types/base";

export type LogsPageScope = "my" | "admin";
export type TypeFilter = "" | NonNullable<LogType>;
export type ActionFilter =
    | ""
    | "note:create"
    | "note:update"
    | "note:delete"
    | "permission:grant"
    | "permission:revoke"
    | "registration:register";

export type LogFilters = {
    type: TypeFilter;
    action: ActionFilter;
    note_key: string;
    target_user_key: string;
    granted_by_key: string;
    granted_to_key: string;
    from_date: string;
    to_date: string;
    search: string;
    limit: number;
    offset: number;
};

export type LogStats = Record<NonNullable<LogType>, number>;
