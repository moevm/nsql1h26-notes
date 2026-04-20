import type { GetLogsQueryParams } from "@/entities/logs/types/requests";
import type { Log } from "@/entities/logs/types/responses";
import { isAdminRole } from "@/shared/lib/access-token-payload";
import { actionLabels, actionOptions } from "@/pages/logs/ui/constants";
import type { ActionFilter, LogFilters, LogsPageScope, TypeFilter } from "@/pages/logs/ui/types";

function textFilter(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function dateFilter(value: string) {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getActionParams(action: ActionFilter): Pick<
    GetLogsQueryParams,
    "note_action" | "permission_action" | "registration_action"
> {
    switch (action) {
        case "note:create":
            return { note_action: "create" };
        case "note:update":
            return { note_action: "update" };
        case "note:delete":
            return { note_action: "delete" };
        case "permission:grant":
            return { permission_action: "grant" };
        case "permission:revoke":
            return { permission_action: "revoke" };
        case "registration:register":
            return { registration_action: "register" };
        default:
            return {};
    }
}

export function buildQuery(
    filters: LogFilters,
    scope: LogsPageScope,
    currentUser: { sub: string; role?: string } | null,
): GetLogsQueryParams {
    const isAdmin = isAdminRole(currentUser?.role);
    const targetUserKey =
        scope === "my" && isAdmin
            ? currentUser?.sub ?? null
            : scope === "admin"
                ? textFilter(filters.target_user_key)
                : null;

    return {
        type: filters.type || null,
        ...getActionParams(filters.action),
        granted_by_key: textFilter(filters.granted_by_key),
        granted_to_key: textFilter(filters.granted_to_key),
        note_key: textFilter(filters.note_key),
        target_user_key: targetUserKey,
        from_date: dateFilter(filters.from_date),
        to_date: dateFilter(filters.to_date),
        search: textFilter(filters.search),
        limit: filters.limit,
        offset: filters.offset,
    };
}

export function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export function formatKey(value?: string | null) {
    if (!value) {
        return "не указано";
    }

    return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;
}

export function getActionLabel(log: Log) {
    return actionLabels[`${log.type}:${log.action}` as ActionFilter] ?? log.action;
}

export function getLogTitle(log: Log) {
    if (log.type === "registration") {
        return "Новый пользователь";
    }

    if (log.type === "permission") {
        return "Изменение доступа к заметке";
    }

    const title = log.state_after?.title || log.state_before?.title || "Без названия";
    return `${getActionLabel(log)}: ${title}`;
}

export function getActionOptions(type: TypeFilter) {
    if (!type) {
        return actionOptions;
    }

    return actionOptions.filter((option) => option.type === type);
}
