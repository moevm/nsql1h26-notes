import type { LogType } from "@/entities/logs/types/base";
import type { ActionFilter, LogFilters } from "@/pages/logs/ui/types";

export const DEFAULT_LIMIT = 20;

export const defaultFilters: LogFilters = {
    type: "",
    action: "",
    note_key: "",
    target_user_key: "",
    granted_by_key: "",
    granted_to_key: "",
    from_date: "",
    to_date: "",
    search: "",
    limit: DEFAULT_LIMIT,
    offset: 0,
};

export const emptyLogStats: Record<NonNullable<LogType>, number> = {
    registration: 0,
    note: 0,
    permission: 0,
};

export const typeLabels: Record<NonNullable<LogType>, string> = {
    registration: "Регистрация",
    note: "Заметки",
    permission: "Доступы",
};

export const actionLabels: Record<ActionFilter, string> = {
    "": "Любое действие",
    "note:create": "Создание заметки",
    "note:update": "Изменение заметки",
    "note:delete": "Удаление заметки",
    "permission:grant": "Выдача доступа",
    "permission:revoke": "Отзыв доступа",
    "registration:register": "Регистрация",
};

export const actionOptions: { value: ActionFilter; type: NonNullable<LogType>; label: string }[] = [
    { value: "note:create", type: "note", label: actionLabels["note:create"] },
    { value: "note:update", type: "note", label: actionLabels["note:update"] },
    { value: "note:delete", type: "note", label: actionLabels["note:delete"] },
    { value: "permission:grant", type: "permission", label: actionLabels["permission:grant"] },
    { value: "permission:revoke", type: "permission", label: actionLabels["permission:revoke"] },
    { value: "registration:register", type: "registration", label: actionLabels["registration:register"] },
];
